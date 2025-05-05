import { useCallback } from 'react';
import { SitemapSection, QuestionnaireData } from '../types/SitemapTypes';

interface UseImportExportArgs {
  pages: SitemapSection[];
  selectedModelGroupKey: string;
  modelGroups: Record<string, string[]>;
  questionnaireData: QuestionnaireData;
  importPages: (jsonData: string) => void;
  onSelectModelGroup: (key: string) => void;
  onSetModelGroups: (groups: Record<string, string[]>) => void;
  onSetQuestionnaireData: (data: QuestionnaireData) => void;
}

const useImportExport = ({
  pages,
  selectedModelGroupKey,
  modelGroups,
  questionnaireData,
  importPages,
  onSelectModelGroup,
  onSetModelGroups,
  onSetQuestionnaireData,
}: UseImportExportArgs) => {
  const exportJson = useCallback(() => {
    const exportData = {
      pages: pages.reduce((acc, page) => ({
        ...acc,
        [page.title]: {
          internal_id: page.id,
          page_id: page.wordpress_id || '',
          model_query_pairs: page.items.map(item => ({
            model: item.model,
            query: item.query,
            internal_id: item.id,
          })),
        },
      }), {} as Record<string, any>),
      selectedModelGroupKey,
      modelGroups,
      questionnaireData,
    };
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const practiceName = questionnaireData.practiceDetails.replace(/\s+/g, '_');
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
      importPages(jsonData);
      if (importedData.selectedModelGroupKey && typeof importedData.selectedModelGroupKey === 'string') {
        onSelectModelGroup(importedData.selectedModelGroupKey);
      }
      if (importedData.modelGroups && typeof importedData.modelGroups === 'object') {
        onSetModelGroups(importedData.modelGroups as Record<string, string[]>);
      }
      if (importedData.questionnaireData && typeof importedData.questionnaireData === 'object') {
        onSetQuestionnaireData(importedData.questionnaireData as QuestionnaireData);
      }
    } catch (error) {
      console.error('Error importing JSON:', error);
    }
  }, [importPages, onSelectModelGroup, onSetModelGroups, onSetQuestionnaireData]);

  return { exportJson, importJson };
};

export default useImportExport; 