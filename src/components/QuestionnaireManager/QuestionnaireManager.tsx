import React, { useEffect } from 'react';
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
    switch (questionnaireState.activeMode) {
      case 'scrape':
        return fillFormData && Object.keys(fillFormData).length > 0;
      case 'questionnaire':
        // Questionnaire mode is currently disabled
        return false;
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
    const currentStatus = workflowState.progressState.planning.questionnaire;
    
    let newStatus: 'pending' | 'in-progress' | 'completed' | 'error';
    if (completed) {
      newStatus = 'completed';
    } else if (questionnaireState.activeMode === 'scrape' && fillFormData) {
      newStatus = 'in-progress';
    } else if (questionnaireState.activeMode === 'template-markdown' && questionnaireState.data.templateMarkdown) {
      newStatus = 'in-progress';
    } else if (questionnaireState.activeMode === 'content-document' && questionnaireState.data.contentDocument) {
      newStatus = 'in-progress';
    } else {
      newStatus = 'pending';
    }
    
    // Only update if the status actually changed
    if (currentStatus !== newStatus) {
      workflowActions.updateTaskStatus('planning', 'questionnaire', newStatus);
    }
  }, [questionnaireState.activeMode, questionnaireState.data.templateMarkdown, questionnaireState.data.contentDocument, fillFormData, workflowState.progressState.planning.questionnaire, workflowActions]);


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
            <div className="questionnaire-manager__removed-notice">
              <h3>Questionnaire Form Temporarily Removed</h3>
              <p>The questionnaire form has been removed to fix a technical issue. Please use one of the alternative input methods:</p>
              <ul>
                <li><strong>Domain Scraping:</strong> Automatically extract data from an existing website</li>
                <li><strong>Template Markdown:</strong> Provide structured content in markdown format</li>
                <li><strong>Content Document:</strong> Upload existing content documentation</li>
              </ul>
              <p>You can switch between these options using the mode selector above.</p>
            </div>
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
        <h4 className="questionnaire-manager__title">Content Input Manager</h4>
        <ProgressIndicator 
          status={workflowState.progressState.planning.questionnaire} 
          size="small"
          showLabel={true}
        />
        
        {isQuestionnaireCompleted() && (
          <div className="questionnaire-manager__completion-notice">
            ✅ Content input completed! You can now proceed to content planning.
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
