import React, { useEffect } from 'react';
import QuestionnaireForm from '../QuestionnaireForm/QuestionnaireForm';
import QuestionnaireModeSelector from '../QuestionnaireModeSelector/QuestionnaireModeSelector';
import MarkdownTextArea from '../MarkdownTextArea/MarkdownTextArea';
import DomainScrapeOptions from '../QuestionnaireForm/DomainScrapeOptions';
import { useQuestionnaire } from '../../contexts/QuestionnaireProvider';
import { useWorkflow } from '../../contexts/WorkflowProvider';
import useFillForm from '../../hooks/useFillForm';
import { createMarkdownFormData } from '../../utils/questionnaireDataUtils';
import ProgressIndicator from '../Common/ProgressIndicator';
import './QuestionnaireManager.sass';

const QuestionnaireManager: React.FC = () => {
  const { state: questionnaireState, actions: questionnaireActions } = useQuestionnaire();
  const { state: workflowState, actions: workflowActions } = useWorkflow();
  const [fillFormData, fillFormStatus, fillForm] = useFillForm();
  
  const formData = questionnaireState.data;

  // Function to check if questionnaire is completed
  const isQuestionnaireCompleted = () => {
    if (!formData) return false;
    
    switch (questionnaireState.activeMode) {
      case 'scrape':
        return fillFormData && Object.keys(fillFormData).length > 0;
      case 'questionnaire':
        // Check if key fields are filled
        const requiredFields = ['practiceDetails', 'siteVision', 'primaryAudience'];
        return requiredFields.every(field => 
          formData[field] && String(formData[field]).trim().length > 0
        );
      case 'template-markdown':
        return questionnaireState.data.templateMarkdown && 
               questionnaireState.data.templateMarkdown.trim().length > 100;
      case 'content-document':
        return questionnaireState.data.contentDocument && 
               questionnaireState.data.contentDocument.trim().length > 100;
      default:
        return false;
    }
  };

  // Track progress changes
  useEffect(() => {
    const completed = isQuestionnaireCompleted();
    if (completed) {
      workflowActions.updateTaskStatus('setup', 'questionnaire', 'completed');
    } else if (formData && Object.keys(formData).length > 0) {
      workflowActions.updateTaskStatus('setup', 'questionnaire', 'in-progress');
    } else {
      workflowActions.updateTaskStatus('setup', 'questionnaire', 'pending');
    }
  }, [formData, questionnaireState, fillFormData, workflowActions]);

  // Sync markdown content with formData when in template-markdown mode
  useEffect(() => {
    if (questionnaireState.activeMode === 'template-markdown' && questionnaireState.data.templateMarkdown) {
      const markdownData = createMarkdownFormData(questionnaireState.data.templateMarkdown, 'template');
      questionnaireActions.updateQuestionnaireData(markdownData);
    } else if (questionnaireState.activeMode === 'content-document' && questionnaireState.data.contentDocument) {
      const markdownData = createMarkdownFormData(questionnaireState.data.contentDocument, 'content');
      questionnaireActions.updateQuestionnaireData(markdownData);
    }
  }, [questionnaireState.activeMode, questionnaireState.data.templateMarkdown, questionnaireState.data.contentDocument, questionnaireActions]);

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
    const markdownData = createMarkdownFormData(markdown, 'template');
    questionnaireActions.updateQuestionnaireData(markdownData);
  };

  const handleContentDocumentChange = (content: string) => {
    questionnaireActions.updateContentDocument(content);
    // Update formData immediately when content changes
    const markdownData = createMarkdownFormData(content, 'content');
    questionnaireActions.updateQuestionnaireData(markdownData);
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
        <div className="questionnaire-manager__title-row">
          <h1 className="questionnaire-manager__title">Questionnaire Manager</h1>
          <ProgressIndicator 
            status={workflowState.progressState.setup.questionnaire} 
            size="large"
            showLabel={true}
          />
        </div>
        <p className="questionnaire-manager__description">
          Choose how you want to input your practice information for website generation.
        </p>
        {isQuestionnaireCompleted() && (
          <div className="questionnaire-manager__completion-notice">
            ✅ Questionnaire completed! You can now proceed to content planning.
          </div>
        )}
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