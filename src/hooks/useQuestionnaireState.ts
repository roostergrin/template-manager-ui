import { useState } from 'react';
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

  const setActiveMode = (mode: QuestionnaireMode) => {
    setState(prevState => ({
      ...prevState,
      activeMode: mode,
      // Automatically switch data source based on mode
      dataSource: mode === 'template-markdown' || mode === 'content-document' ? 'markdown' : 'structured'
    }));
  };

  const setDataSource = (source: QuestionnaireDataSource) => {
    setState(prevState => ({
      ...prevState,
      dataSource: source
    }));
  };

  const updateScrapeData = (domain: string, scraped_data?: Record<string, unknown>) => {
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
  };

  const updateQuestionnaireData = (data: Record<string, unknown>) => {
    setState(prevState => ({
      ...prevState,
      data: {
        ...prevState.data,
        questionnaire: data
      }
    }));
  };

  const updateTemplateMarkdown = (markdown: string) => {
    setState(prevState => ({
      ...prevState,
      data: {
        ...prevState.data,
        templateMarkdown: markdown
      }
    }));
  };

  const updateContentDocument = (content: string) => {
    setState(prevState => ({
      ...prevState,
      data: {
        ...prevState.data,
        contentDocument: content
      }
    }));
  };

  const resetData = () => {
    setState(initialState);
  };

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