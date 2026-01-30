import { useCallback } from 'react';
import { useSitemap } from '../contexts/SitemapProvider';
import { useAppConfig } from '../contexts/AppConfigProvider';
import { useQuestionnaire } from '../contexts/QuestionnaireProvider';

const useImportExport = () => {
  const { state: sitemapState, actions: sitemapActions } = useSitemap();
  const { state: appConfigState, actions: appConfigActions } = useAppConfig();
  const { state: questionnaireState, actions: questionnaireActions } = useQuestionnaire();
  
  const pages = sitemapState.pages;
  const selectedModelGroupKey = appConfigState.selectedModelGroupKey || Object.keys(appConfigState.modelGroups)[0];
  const modelGroups = appConfigState.modelGroups;
  const questionnaireData = questionnaireState.data;
  const exportJson = useCallback(() => {
    const exportData = {
      pages: pages.map(page => ({
        id: page.id,
        title: page.title,
        wordpress_id: page.wordpress_id || '',
        items: page.items.map(item => ({
          model: item.model,
          query: item.query,
          id: item.id,
          useDefault: Boolean(item.useDefault),
          preserve_image: item.preserve_image,
        })),
        // RAG allocation fields - only include if present
        ...(page.allocated_markdown && { allocated_markdown: page.allocated_markdown }),
        ...(page.allocation_confidence !== undefined && { allocation_confidence: page.allocation_confidence }),
        ...(page.source_location && { source_location: page.source_location }),
        ...(page.mapped_scraped_page && { mapped_scraped_page: page.mapped_scraped_page }),
        // Hierarchy fields - only include if present
        ...(page.slug && { slug: page.slug }),
        ...(page.parent_slug && { parent_slug: page.parent_slug }),
        ...(page.depth !== undefined && { depth: page.depth }),
        ...(page.description && { description: page.description }),
      })),
      selectedModelGroupKey,
      modelGroups,
      questionnaireData,
    };
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Extract practice name from available data or use fallback
    const practiceName = questionnaireData?.scrape?.domain?.replace(/\./g, '_').replace(/\s+/g, '_') 
      || questionnaireData?.questionnaire?.practiceName?.toString().replace(/\s+/g, '_')
      || 'sitemap_export';
    const siteType = selectedModelGroupKey.replace(/\s+/g, '_');
    link.download = `${siteType}_${practiceName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [pages, selectedModelGroupKey, modelGroups, questionnaireData]);

  const importJson = useCallback((jsonData: string) => {
    try {
      const importedData = JSON.parse(jsonData);
      sitemapActions.importPagesFromJson(jsonData);
      if (importedData.selectedModelGroupKey && typeof importedData.selectedModelGroupKey === 'string') {
        appConfigActions.setSelectedModelGroup(importedData.selectedModelGroupKey);
      }
      if (importedData.modelGroups && typeof importedData.modelGroups === 'object') {
        // Note: This would need to be implemented in AppConfigProvider if needed
        console.warn('Model groups import not yet implemented in AppConfigProvider');
      }
      if (importedData.questionnaireData && typeof importedData.questionnaireData === 'object') {
        questionnaireActions.updateQuestionnaireData(importedData.questionnaireData);
      }
    } catch (error) {
      console.error('Error importing JSON:', error);
    }
  }, [sitemapActions, appConfigActions, questionnaireActions]);

  return { exportJson, importJson };
};

export default useImportExport; 