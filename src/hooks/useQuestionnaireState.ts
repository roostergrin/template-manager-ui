import { useState, useCallback } from 'react';
import { 
  QuestionnaireMode, 
  QuestionnaireState, 
  QuestionnaireStateActions,
  QuestionnaireDataSource
} from '../types/QuestionnaireStateTypes';

const initialState: QuestionnaireState = {
  activeMode: 'scrape',
  dataSource: 'structured',
  data: {}
};

const useQuestionnaireState = (): [QuestionnaireState, QuestionnaireStateActions] => {
  const [state, setState] = useState<QuestionnaireState>(initialState);

  const setActiveMode = useCallback((mode: QuestionnaireMode) => {
    setState(prevState => ({
      ...prevState,
      activeMode: mode,
      // Automatically switch data source based on mode
      dataSource: mode === 'template-markdown' || mode === 'content-document' ? 'markdown' : 'structured'
    }));
  }, []);

  const setDataSource = useCallback((source: QuestionnaireDataSource) => {
    setState(prevState => ({
      ...prevState,
      dataSource: source
    }));
  }, []);

  const updateScrapeData = useCallback((domain: string, scraped_data?: Record<string, unknown>) => {
    setState(prevState => ({
      ...prevState,
      data: {
        ...prevState.data,
        scrape: {
          domain,
          scraped_data
        }
      }
    }));
  }, []);

  const updateQuestionnaireData = useCallback((data: Record<string, unknown>) => {
    setState(prevState => ({
      ...prevState,
      data: {
        ...prevState.data,
        questionnaire: data
      }
    }));
  }, []);

  const updateTemplateMarkdown = useCallback((markdown: string) => {
    setState(prevState => ({
      ...prevState,
      data: {
        ...prevState.data,
        templateMarkdown: markdown
      }
    }));
  }, []);

  const updateContentDocument = useCallback((content: string) => {
    setState(prevState => ({
      ...prevState,
      data: {
        ...prevState.data,
        contentDocument: content
      }
    }));
  }, []);

  const resetData = useCallback(() => {
    setState(initialState);
  }, []);

  const actions: QuestionnaireStateActions = {
    setActiveMode,
    setDataSource,
    updateScrapeData,
    updateQuestionnaireData,
    updateTemplateMarkdown,
    updateContentDocument,
    resetData
  };

  return [state, actions];
};

export default useQuestionnaireState; 