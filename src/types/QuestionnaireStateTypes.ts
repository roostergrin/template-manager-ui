export type QuestionnaireMode = 'scrape' | 'questionnaire' | 'template-markdown' | 'content-document';

export type QuestionnaireDataSource = 'structured' | 'markdown';

export interface QuestionnaireStateData {
  scrape?: {
    domain: string;
    scraped_data?: Record<string, unknown>;
  };
  questionnaire?: Record<string, unknown>;
  templateMarkdown?: string;
  contentDocument?: string;
}

export interface QuestionnaireState {
  activeMode: QuestionnaireMode;
  dataSource: QuestionnaireDataSource;
  data: QuestionnaireStateData;
}

export interface QuestionnaireStateActions {
  setActiveMode: (mode: QuestionnaireMode) => void;
  setDataSource: (source: QuestionnaireDataSource) => void;
  updateScrapeData: (domain: string, data?: Record<string, unknown>) => void;
  updateQuestionnaireData: (data: Record<string, unknown>) => void;
  updateTemplateMarkdown: (markdown: string) => void;
  updateContentDocument: (content: string) => void;
  resetData: () => void;
}

// Helper type for components that can work with either structured data or markdown
export interface FlexibleQuestionnaireData {
  dataSource: QuestionnaireDataSource;
  structuredData?: Record<string, unknown>;
  markdownData?: string;
} 