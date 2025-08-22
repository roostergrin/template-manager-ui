import apiClient from './apiService';
import { GenerateRouterRequest, GenerateRouterResponse } from '../types/APIServiceTypes';

const generateRouterService = async (request: GenerateRouterRequest): Promise<GenerateRouterResponse> => {
  try {
    console.log('🚀 Sending router generation request:', request);
    const response = await apiClient.post('/generate-router/', request);
    
    console.log('📡 Raw API response:', response);
    console.log('📊 Response status:', response?.status);
    console.log('📋 Response data:', response?.data || response);

    // The apiClient.post already handles the response and returns the data directly
    // So 'response' here is actually the response data, not the full axios response
    const responseData = response;

    console.log('✅ Processed response data:', responseData);
    return responseData;
  } catch (error) {
    console.error('❌ Router generation service error:', error);
    
    // Enhanced error reporting
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const statusText = error.response.statusText;
      const responseData = error.response.data;
      
      console.error('📡 Error response data:', responseData);
      throw new Error(`Server error ${status}: ${statusText}. Response: ${JSON.stringify(responseData)}`);
    } else if (error.request) {
      // Request was made but no response received
      console.error('📡 No response received:', error.request);
      throw new Error('No response received from server. Check if the backend is running and the endpoint exists.');
    } else {
      // Something else happened
      throw new Error(`Request setup error: ${error.message}`);
    }
  }
};

export default generateRouterService;
