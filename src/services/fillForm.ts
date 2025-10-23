import api from './apiService';

export type FillFormRequest = {
  scrape: boolean;
  domain: string;
  use_selenium?: boolean;
  scroll?: boolean;
  max_pages?: number;
};

export type FillFormResponse = {
  questionnaire_data: Record<string, unknown>;
  context: Record<string, unknown>;
};

const fillForm = async (data: FillFormRequest): Promise<FillFormResponse> => {
  const response = await api.post<FillFormResponse>('/fill-form/', data);
  return response;
};

export default fillForm; 