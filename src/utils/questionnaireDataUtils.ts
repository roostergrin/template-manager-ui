import { QuestionnaireData } from '../types/APIServiceTypes';

/**
 * Utility functions for handling questionnaire data in both structured and markdown formats
 */

// Type guard to check if data is markdown-based
export const isMarkdownData = (data: unknown): data is { _dataSource: 'markdown'; _markdownContent: string } => {
  return data !== null && typeof data === 'object' && data !== undefined && 
         (data as any)._dataSource === 'markdown';
};

// Convert markdown data to structured questionnaire data format
export const convertMarkdownToQuestionnaireData = (markdownContent: string): QuestionnaireData => {
  return {
    practiceDetails: markdownContent,
    siteVision: '',
    primaryAudience: '',
    secondaryAudience: '',
    demographics: '',
    uniqueQualities: '',
    contentCreation: 'new',
    hasBlog: false,
    blogType: '',
    topTreatments: '',
    writingStyle: '',
    topicsToAvoid: '',
    communityEngagement: '',
    testimonials: '',
    patientExperience: '',
    financialOptions: '',
    // Add metadata to indicate this was converted from markdown
    _isMarkdownData: true,
    _markdownContent: markdownContent
  } as QuestionnaireData & { _isMarkdownData?: boolean; _markdownContent?: string };
};

// Get effective questionnaire data regardless of source type
export const getEffectiveQuestionnaireData = (data: unknown): QuestionnaireData => {
  if (isMarkdownData(data)) {
    return convertMarkdownToQuestionnaireData(data._markdownContent || '');
  }
  
  // Return structured data as-is, with fallback defaults
  return (data as QuestionnaireData) || {};
};

// Extract markdown content from either markdown or structured data
export const extractMarkdownContent = (data: unknown): string => {
  if (isMarkdownData(data)) {
    return data._markdownContent || '';
  }
  
  // If it's structured data with markdown metadata, extract it
  if (data && typeof data === 'object' && (data as any)._markdownContent) {
    return (data as any)._markdownContent;
  }
  
  // For structured data, you could combine fields into markdown format
  if (data && typeof data === 'object') {
    const dataObj = data as any;
    const parts: string[] = [];
    
    if (dataObj.practiceDetails) parts.push(`# Practice Details\n${dataObj.practiceDetails}\n`);
    if (dataObj.siteVision) parts.push(`## Site Vision\n${dataObj.siteVision}\n`);
    if (dataObj.primaryAudience) parts.push(`## Primary Audience\n${dataObj.primaryAudience}\n`);
    if (dataObj.secondaryAudience) parts.push(`## Secondary Audience\n${dataObj.secondaryAudience}\n`);
    if (dataObj.topTreatments) parts.push(`## Top Treatments\n${dataObj.topTreatments}\n`);
    if (dataObj.communityEngagement) parts.push(`## Community Engagement\n${dataObj.communityEngagement}\n`);
    if (dataObj.testimonials) parts.push(`## Testimonials\n${dataObj.testimonials}\n`);
    
    return parts.join('\n');
  }
  
  return '';
};

// Create markdown-based form data
export const createMarkdownFormData = (markdownContent: string, type: 'template' | 'content' = 'template') => {
  return {
    _dataSource: 'markdown',
    _markdownContent: markdownContent,
    [type === 'template' ? 'templateMarkdown' : 'contentDocument']: markdownContent
  };
}; 