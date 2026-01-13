// Mock data for Logo and Favicon upload steps
import { LogoUploadResult } from '../../types/UnifiedWorkflowTypes';

export interface FaviconUploadResult {
  success: boolean;
  faviconUrl?: string;
}

export const createMockLogoResult = (): LogoUploadResult => {
  return {
    success: true,
    logoUrl: 'https://via.placeholder.com/200x60?text=Logo',
    headerVariant: 'dark',
  };
};

export const createMockFaviconResult = (): FaviconUploadResult => {
  return {
    success: true,
    faviconUrl: 'https://via.placeholder.com/32x32?text=F',
  };
};
