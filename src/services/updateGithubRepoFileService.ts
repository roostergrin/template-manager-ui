import apiClient from "./apiService";
import { UpdateGithubRepoFileRequest, UpdateGithubRepoFileResponse } from "../types/APIServiceTypes";

// Service for updating a single file in a GitHub repository
const updateGithubRepoFileService = async (request: UpdateGithubRepoFileRequest): Promise<UpdateGithubRepoFileResponse> => {
  console.log('🔄 Starting GitHub repo file update service with request:', {
    owner: request.owner,
    repo: request.repo,
    path: request.path,
    contentLength: request.content?.length || 0,
    contentPreview: request.content?.substring(0, 100) + '...',
    message: request.message,
    branch: request.branch,
    sha: request.sha
  });

  try {
    // Transform request to match backend expectations
    const backendRequest = {
      owner: request.owner,
      repo: request.repo,
      file_path: request.path,        // Backend expects 'file_path' not 'path'
      file_content: request.content,  // Backend expects 'file_content' not 'content'
      message: request.message,
      branch: request.branch,
      sha: request.sha
    };

    console.log('📋 Transformed request for backend:', backendRequest);

    const response = await apiClient.post<UpdateGithubRepoFileResponse>("/update-github-repo-file", backendRequest);
    
    console.log('✅ GitHub repo file update response:', response);
    console.log('✅ Response type:', typeof response);
    console.log('✅ Response keys:', response ? Object.keys(response) : 'No response');
    
    if (!response) {
      console.error('❌ No response from GitHub repo file update');
      throw new Error('Failed to update GitHub repository file');
    }
    
    return response;
  } catch (error) {
    console.error('❌ GitHub repo file update error:', error);
    console.error('📋 Request details:', request);
    
    // Enhanced error logging
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      console.error('🔍 Error response status:', axiosError.response?.status);
      console.error('🔍 Error response data:', axiosError.response?.data);
      console.error('🔍 Error response headers:', axiosError.response?.headers);
      
      // Check for validation errors
      if (axiosError.response?.data && typeof axiosError.response.data === 'object') {
        console.error('🔍 Stringified error response:', JSON.stringify(axiosError.response.data, null, 2));
        
        if (axiosError.response.data.detail && Array.isArray(axiosError.response.data.detail)) {
          console.error('🔍 Validation errors:');
          axiosError.response.data.detail.forEach((err: any, index: number) => {
            console.error(`   ${index + 1}. ${JSON.stringify(err, null, 2)}`);
          });
        }
      }
    }
    
    throw error;
  }
};

export default updateGithubRepoFileService;
