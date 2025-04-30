import { modelGroups } from '../modelGroups';

export const getBackendSiteTypeForModelGroup = (key: string): string | undefined => {
  return modelGroups[key]?.backend_site_type;
};
