import { QueryStatus, useMutation } from '@tanstack/react-query';
import updateGithubRepoFileUploadService from '../services/updateGithubRepoFileUploadService';
import { UpdateGithubRepoFileUploadRequest, UpdateGithubRepoFileUploadResponse } from '../types/APIServiceTypes';

const useUpdateGithubRepoFileUpload = () => {
  const mutation = useMutation({
    mutationFn: updateGithubRepoFileUploadService,
    mutationKey: ['updateGithubRepoFileUpload'],
  });

  return [
    mutation.data,
    mutation.status,
    mutation.mutateAsync
  ] as [
    UpdateGithubRepoFileUploadResponse | undefined,
    QueryStatus,
    (variables: UpdateGithubRepoFileUploadRequest) => Promise<UpdateGithubRepoFileUploadResponse>
  ];
};

export default useUpdateGithubRepoFileUpload;
