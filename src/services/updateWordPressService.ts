interface WordPressConfig {
  api_url: string;
  username: string;
  password: string;
}

// Backend server configuration - Update this URL to match your actual backend server
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://localhost:8000';

interface WordPressUpdateData {
  wordpress_config: WordPressConfig;
  data: Record<string, unknown>; // Changed from any to unknown for better type safety
}

interface WordPressPageResult {
  page_id: string | number;
  success: boolean;
  message?: string;
  created_new_page?: boolean;
  new_page_id?: number;
}

interface WordPressUpdateResponse {
  success: boolean;
  total_pages: number;
  successful_updates: number;
  failed_updates: number;
  results: WordPressPageResult[];
  message?: string;
}

export const updateWordPressService = async (data: WordPressUpdateData): Promise<WordPressUpdateResponse> => {
  try {
    console.log('🔄 Attempting to connect to backend at:', BACKEND_BASE_URL);
    console.log('📝 Sending WordPress update request...');
    
    const response = await fetch(`${BACKEND_BASE_URL}/update-wordpress/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      // Note: In production, you should not ignore SSL errors
      // This is only for development with self-signed certificates
    });

    console.log('📡 Backend response status:', response.status);

    // Check for empty response specifically
    const responseText = await response.text();
    console.log('📄 Backend response length:', responseText.length);
    
    if (!responseText) {
      throw new Error(`The backend server at ${BACKEND_BASE_URL} returned an empty response. This indicates the /update-wordpress/ endpoint may not be properly configured on the server. Please check your backend server configuration.`);
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.detail || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${responseText || 'Unknown error'}`;
      }
      console.error('❌ Backend returned error:', errorMessage);
      throw new Error(errorMessage);
    }

    try {
      const result = JSON.parse(responseText);
      console.log('✅ Successfully parsed backend response');
      return result;
    } catch {
      console.error('❌ Failed to parse backend response as JSON');
      throw new Error('The server returned invalid JSON. Please check the backend server logs for errors.');
    }
  } catch (error) {
    console.error('❌ WordPress update service error:', error);
    
    // Handle network errors and specific cases
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const isHttpsLocalhost = BACKEND_BASE_URL.startsWith('https://localhost');
      const baseErrorMessage = `❌ Unable to connect to the WordPress update service at ${BACKEND_BASE_URL}. Please ensure:
      
1. The backend server is running
2. The backend URL is correct
3. CORS is properly configured on the backend
4. No firewall is blocking the connection`;

             const httpsMessage = isHttpsLocalhost ? `
5. ⚠️  SSL Certificate Issue Detected: You're using HTTPS with localhost. 
   SOLUTIONS TO FIX THIS:
   
   A) Accept the certificate in your browser:
      1. Open a new tab and go to: ${BACKEND_BASE_URL}
      2. Click "Advanced" on the security warning
      3. Click "Proceed to localhost (unsafe)" or similar
      4. Return to this app and try again
   
   B) Start Chrome with disabled security (DEVELOPMENT ONLY):
      - Close all Chrome instances
      - Run: open -a "Google Chrome" --args --disable-web-security --user-data-dir="/tmp/chrome_dev"
      - Or add --ignore-certificate-errors flag
   
   C) Use a proper SSL certificate for localhost
   D) Set up a reverse proxy with valid SSL` : '';

      throw new Error(`${baseErrorMessage}${httpsMessage}

Current backend URL: ${BACKEND_BASE_URL}`);
    }
    
    // Re-throw other errors as-is since they're already descriptive
    throw error;
  }
};

export type { WordPressConfig, WordPressUpdateData, WordPressPageResult, WordPressUpdateResponse }; 