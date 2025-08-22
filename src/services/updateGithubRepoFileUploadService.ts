import apiClient from './apiService';
import { UpdateGithubRepoFileUploadRequest, UpdateGithubRepoFileUploadResponse } from '../types/APIServiceTypes';

const updateGithubRepoFileUploadService = async (request: UpdateGithubRepoFileUploadRequest): Promise<UpdateGithubRepoFileUploadResponse> => {
  console.log('🔄 Starting file upload service with request:', {
    owner: request.owner,
    repo: request.repo,
    path: request.path,
    fileName: request.upload_file?.name,
    fileSize: request.upload_file?.size,
    fileType: request.upload_file?.type,
    message: request.message,
    branch: request.branch,
    sha: request.sha
  });

  const formData = new FormData();
  
  // Append form fields
  formData.append('owner', request.owner);
  formData.append('repo', request.repo);
  formData.append('file_path', request.path);  // Backend expects 'file_path' not 'path'
  formData.append('upload_file', request.upload_file);
  
  if (request.message) {
    formData.append('message', request.message);
  }
  
  if (request.branch) {
    formData.append('branch', request.branch);
  }
  
  if (request.sha) {
    formData.append('sha', request.sha);
  }

  console.log('📋 FormData contents:', {
    owner: formData.get('owner'),
    repo: formData.get('repo'),
    file_path: formData.get('file_path'),  // Updated to match backend expectation
    message: formData.get('message'),
    branch: formData.get('branch'),
    sha: formData.get('sha'),
    filePresent: !!formData.get('upload_file'),
    fileName: (formData.get('upload_file') as File)?.name,
    fileSize: (formData.get('upload_file') as File)?.size,
    fileType: (formData.get('upload_file') as File)?.type
  });

  // Additional debug: Check if all required fields are present
  const requiredFields = ['owner', 'repo', 'file_path', 'upload_file'];
  const missingFields = requiredFields.filter(field => !formData.get(field));
  if (missingFields.length > 0) {
    console.error('⚠️ Missing required fields:', missingFields);
  }

  try {
    const response = await apiClient.post('/update-github-repo-file-upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }) as { data: UpdateGithubRepoFileUploadResponse };

    console.log('✅ File upload service raw response:', response);
    console.log('✅ File upload service response.data:', response.data);
    console.log('✅ Response data type:', typeof response.data);
    console.log('✅ Response data keys:', response.data ? Object.keys(response.data) : 'No data');

    // Handle different response formats
    if (!response.data) {
      console.error('❌ Response structure:', {
        hasResponse: !!response,
        responseKeys: response ? Object.keys(response) : 'No response',
        dataValue: response.data,
        dataType: typeof response.data
      });
      
      // Check if response itself contains the data (some APIs return data directly)
      if (response && typeof response === 'object' && 'success' in response) {
        console.log('🔄 Using response as data (no nested .data property)');
        return response as UpdateGithubRepoFileUploadResponse;
      }
      
      throw new Error('No response data received from file upload service');
    }

    // Handle empty response.data
    if (response.data === null || response.data === undefined) {
      console.error('❌ Empty response.data:', response.data);
      
      // Check if the request was successful but returned empty data
      if (response && Object.keys(response).length > 1) {
        console.log('🔄 Request appears successful but response.data is empty');
        // Return a minimal success response
        return {
          success: true,
          message: 'File uploaded successfully (empty response)'
        } as UpdateGithubRepoFileUploadResponse;
      }
      
      throw new Error('Empty response data received from file upload service');
    }

    return response.data;
  } catch (error) {
    console.error('❌ File upload service error:', error);
    
    // Enhanced error logging with more detail
    const errorInfo: any = {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : 'Unknown error',
      request: {
        owner: request.owner,
        repo: request.repo,
        path: request.path,
        fileName: request.upload_file?.name,
        fileSize: request.upload_file?.size,
        fileType: request.upload_file?.type,
        message: request.message,
        branch: request.branch,
        sha: request.sha
      }
    };

    // Check for Axios error response
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      errorInfo.status = axiosError.response?.status;
      errorInfo.statusText = axiosError.response?.statusText;
      errorInfo.responseData = axiosError.response?.data;
      
      // Try to extract more details from response
      console.error('🔍 Raw backend response:', axiosError.response?.data);
      console.error('🔍 Response headers:', axiosError.response?.headers);
      console.error('🔍 Response status:', axiosError.response?.status);
      
      // If response.data is an object, stringify it for better visibility
      if (axiosError.response?.data && typeof axiosError.response.data === 'object') {
        console.error('🔍 Stringified response data:', JSON.stringify(axiosError.response.data, null, 2));
        
        // Extract detail array if present (common in FastAPI/Pydantic validation errors)
        const responseData = axiosError.response.data;
        if (responseData.detail && Array.isArray(responseData.detail)) {
          console.error('🔍 Backend validation errors:');
          responseData.detail.forEach((error: any, index: number) => {
            console.error(`   ${index + 1}. ${JSON.stringify(error, null, 2)}`);
          });
        }
      }
      
      // Special handling for 422 errors (common for file updates)
      if (axiosError.response?.status === 422) {
        console.error('💡 422 Error Suggestions:');
        console.error('   - File might already exist and require SHA for update');
        console.error('   - Check if file path format is correct');
        console.error('   - Verify repository permissions');
        console.error('   - Current request SHA:', request.sha || 'NOT PROVIDED');
      }
    }
    
    console.error('📋 Complete error details:', errorInfo);
    throw error;
  }
};

export default updateGithubRepoFileUploadService;
