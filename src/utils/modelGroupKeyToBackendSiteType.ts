import { modelGroups } from '../siteTemplates';

export const getBackendSiteTypeForModelGroup = (key: string): string | undefined => {
  return modelGroups[key]?.backend_site_type;
};
