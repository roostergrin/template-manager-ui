import React, { useEffect } from 'react';
import QuestionnaireForm from '../QuestionnaireForm/QuestionnaireForm';
import QuestionnaireModeSelector from '../QuestionnaireModeSelector/QuestionnaireModeSelector';
import MarkdownTextArea from '../MarkdownTextArea/MarkdownTextArea';
import DomainScrapeOptions from '../QuestionnaireForm/DomainScrapeOptions';
import useQuestionnaireState from '../../hooks/useQuestionnaireState';
import useFillForm from '../../hooks/useFillForm';
import { createMarkdownFormData } from '../../utils/questionnaireDataUtils';
import './QuestionnaireManager.sass';

interface QuestionnaireManagerProps {
  formData: Record<string, unknown> | null;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}

const QuestionnaireManager: React.FC<QuestionnaireManagerProps> = ({
  formData,
  setFormData
}) => {
  const [questionnaireState, questionnaireActions] = useQuestionnaireState();
  const [fillFormData, fillFormStatus, fillForm] = useFillForm();

  // Sync markdown content with formData when in template-markdown mode
  useEffect(() => {
    if (questionnaireState.activeMode === 'template-markdown' && questionnaireState.data.templateMarkdown) {
      setFormData(createMarkdownFormData(questionnaireState.data.templateMarkdown, 'template'));
    } else if (questionnaireState.activeMode === 'content-document' && questionnaireState.data.contentDocument) {
      setFormData(createMarkdownFormData(questionnaireState.data.contentDocument, 'content'));
    }
  }, [questionnaireState.activeMode, questionnaireState.data.templateMarkdown, questionnaireState.data.contentDocument, setFormData]);

  const handleFillForm = (scrape: boolean, useSelenium: boolean, scroll: boolean) => {
    const domain = questionnaireState.data.scrape?.domain || '';
    if (domain) {
      fillForm({ domain, scrape, use_selenium: useSelenium, scroll });
    }
  };

  const handleMockScrape = (domain: string) => {
    questionnaireActions.updateScrapeData(domain, { mock: true, domain });
    // You can add mock scrape logic here if needed
  };

  const handleTemplateMarkdownChange = (markdown: string) => {
    questionnaireActions.updateTemplateMarkdown(markdown);
    // Update formData immediately when markdown changes
    setFormData(createMarkdownFormData(markdown, 'template'));
  };

  const handleContentDocumentChange = (content: string) => {
    questionnaireActions.updateContentDocument(content);
    // Update formData immediately when content changes
    setFormData(createMarkdownFormData(content, 'content'));
  };

  const renderContent = () => {
    switch (questionnaireState.activeMode) {
      case 'scrape':
        return (
          <div className="questionnaire-manager__content">
            <DomainScrapeOptions
              domain={questionnaireState.data.scrape?.domain || ''}
              setDomain={(domain) => questionnaireActions.updateScrapeData(domain)}
              handleFillForm={handleFillForm}
              fillFormStatus={fillFormStatus}
              fillFormData={fillFormData}
              mockScrapeDomain={handleMockScrape}
            />
            {fillFormData && (
              <div className="questionnaire-manager__scraped-data">
                <h3>Scraped Data Preview</h3>
                <pre>{JSON.stringify(fillFormData, null, 2)}</pre>
              </div>
            )}
          </div>
        );

      case 'questionnaire':
        return (
          <div className="questionnaire-manager__content">
            <QuestionnaireForm 
              formData={formData || {}} 
              setFormData={(data) => {
                const formDataValue = typeof data === 'function' ? data(formData || {}) : data;
                setFormData(formDataValue || {});
                if (formDataValue) {
                  questionnaireActions.updateQuestionnaireData(formDataValue);
                }
              }} 
            />
          </div>
        );

      case 'template-markdown':
        return (
          <div className="questionnaire-manager__content">
            <MarkdownTextArea
              title="Template Questionnaire Markdown"
              description="Paste your template questionnaire markdown content here. This content will be used as the primary data source for the sitemap generation."
              value={questionnaireState.data.templateMarkdown || ''}
              onChange={handleTemplateMarkdownChange}
              placeholder="# Template Questionnaire

## Practice Basics
- Practice Name: 
- Orthodontist Name:
- Practice Tagline:

## Contact Information
- Phone:
- Email:
- Address:

## About
- Doctor Bio:
- Team Overview:
- Mission Statement:

..."
            />
            <div className="questionnaire-manager__markdown-info">
              <p><strong>Note:</strong> This markdown content is now being used as your primary questionnaire data. The sitemap will use this content instead of the structured form data.</p>
            </div>
          </div>
        );

      case 'content-document':
        return (
          <div className="questionnaire-manager__content">
            <MarkdownTextArea
              title="Content Document"
              description="Paste your content document markdown here. This content will be used as the primary data source for the sitemap generation."
              value={questionnaireState.data.contentDocument || ''}
              onChange={handleContentDocumentChange}
              placeholder="# Practice Content Document

## About Our Practice
Lorem ipsum dolor sit amet, consectetur adipiscing elit...

## Our Services
### Invisalign Treatment
Description of Invisalign services...

### Traditional Braces
Description of traditional braces...

## Meet Dr. Smith
Dr. Smith has been practicing orthodontics for over 15 years...

## Patient Testimonials
'Dr. Smith and his team are amazing...' - Sarah J.

..."
            />
            <div className="questionnaire-manager__markdown-info">
              <p><strong>Note:</strong> This markdown content is now being used as your primary questionnaire data. The sitemap will use this content instead of the structured form data.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="questionnaire-manager">
      <div className="questionnaire-manager__header">
        <h1 className="questionnaire-manager__title">Questionnaire Manager</h1>
        <p className="questionnaire-manager__description">
          Choose how you want to input your practice information for website generation.
        </p>
      </div>
      
      <QuestionnaireModeSelector
        activeMode={questionnaireState.activeMode}
        onModeChange={questionnaireActions.setActiveMode}
      />

      {renderContent()}

      {/* Debug Panel - Remove in production */}
      <div className="questionnaire-manager__debug">
        <details>
          <summary>Debug: Current State & Form Data</summary>
          <div>
            <h4>Questionnaire State:</h4>
            <pre>{JSON.stringify(questionnaireState, null, 2)}</pre>
            <h4>Form Data (sent to Sitemap):</h4>
            <pre>{JSON.stringify(formData, null, 2)}</pre>
          </div>
        </details>
      </div>
    </div>
  );
};

export default QuestionnaireManager; 