import React, { useState } from 'react';
import QuestionnaireManager from '../QuestionnaireManager/QuestionnaireManager';
import EnhancedSitemap from './EnhancedSitemap';
import EnhancedProvisionSection from './EnhancedProvisionSection';
import EnhancedImageTester from './EnhancedImageTester';
import GitHubRepoCreator from './GitHubRepoCreator';
import ContentGenerator from './ContentGenerator';
import RepositoryUpdater from './RepositoryUpdater';
import { QuestionnaireData } from '../../types/SitemapTypes';
import { initialModelGroups } from '../../modelGroups';
import { getBackendSiteTypeForModelGroup } from '../../utils/modelGroupKeyToBackendSiteType';
import './WorkflowManager.sass';

interface WorkflowManagerProps {
  questionnaireData: Record<string, unknown>;
  setQuestionnaireData: (data: Record<string, unknown>) => void;
}

const WorkflowManager: React.FC<WorkflowManagerProps> = ({
  questionnaireData,
  setQuestionnaireData
}) => {
  const [activeTab, setActiveTab] = useState<string>('infrastructure');
  const [modelGroups, setModelGroups] = useState<Record<string, string[]>>(initialModelGroups);
  const [selectedModelGroupKey, setSelectedModelGroupKey] = useState<string>(Object.keys(initialModelGroups)[0]);
  const [provisioningData, setProvisioningData] = useState<any>(null);
  const [repoData, setRepoData] = useState<any>(null);
  const [generatedContent, setGeneratedContent] = useState<{
    pages: object | null;
    global: object | null;
  }>({ pages: null, global: null });
  const [sitemapPages, setSitemapPages] = useState<any[]>([]);

  const handlePagesChange = (pages: any[]) => {
    setSitemapPages(pages);
  };

  // Convert to QuestionnaireData for Sitemap component
  const questionnaireDataForSitemap: QuestionnaireData = (questionnaireData as unknown as QuestionnaireData) || {
    practiceDetails: '',
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
    financialOptions: ''
  };

  const handleQuestionnaireDataChange = (data: QuestionnaireData) => {
    setQuestionnaireData(data as unknown as Record<string, unknown>);
  };

  const handleContentGenerated = (pagesContent: object, globalContent: object) => {
    setGeneratedContent({
      pages: pagesContent,
      global: globalContent
    });
  };

  const currentModels = initialModelGroups[selectedModelGroupKey] || [];
  const siteType = getBackendSiteTypeForModelGroup(selectedModelGroupKey) || 'stinson';

  const tabs = [
    {
      id: 'infrastructure',
      label: '🏗️ Infrastructure & Assets',
      description: 'Create GitHub repo and provision AWS resources'
    },
    {
      id: 'setup',
      label: '📝 Setup & Configuration',
      description: 'Configure questionnaire, content docs, and sync assets'
    },
    {
      id: 'content',
      label: '🗺️ Content Planning & Generation',
      description: 'Plan structure, generate content, and update repo'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'infrastructure':
        return (
          <div className="tab-content">
            <div className="tab-content__header">
              <h2>🏗️ Infrastructure & Assets</h2>
              <p>First, create your GitHub repository and provision AWS infrastructure for hosting and assets.</p>
            </div>
            
            <div className="infrastructure-sections">
              <div className="section">
                <h3>📁 Create GitHub Repository</h3>
                <p>Create a new GitHub repository from template to host your site code.</p>
                <GitHubRepoCreator onRepoCreated={setRepoData} />
              </div>
              
              <div className="section">
                <h3>☁️ Provision AWS Resources</h3>
                <p>Create S3 bucket, CloudFront distribution, and CodePipeline for your site.</p>
                <EnhancedProvisionSection 
                  onProvisioningComplete={setProvisioningData}
                />
              </div>
            </div>
          </div>
        );

      case 'setup':
        return (
          <div className="tab-content">
            <div className="tab-content__header">
              <h2>📝 Setup & Configuration</h2>
              <p>Configure your site settings, fill out the questionnaire, add content documents, and sync scraped assets.</p>
            </div>
            
            <div className="setup-sections">
              <div className="section">
                <h3>📋 Site Questionnaire</h3>
                <p>Fill out the questionnaire to configure your site's basic settings and content preferences.</p>
                <QuestionnaireManager 
                  formData={questionnaireData} 
                  setFormData={setQuestionnaireData} 
                />
              </div>
              

              
              <div className="section">
                <h3>🖼️ Sync Scraped Assets</h3>
                <p>Upload scraped images to S3 and get CloudFront URLs to prevent hotlinking.</p>
                <EnhancedImageTester 
                  prefilledBucket={provisioningData?.bucketName}
                  prefilledCloudFront={provisioningData?.assets_distribution_url}
                />
              </div>
            </div>
          </div>
        );

      case 'content':
        return (
          <div className="tab-content">
            <div className="tab-content__header">
              <h2>🗺️ Content Planning & Generation</h2>
              <p>Plan your site structure, organize pages, generate content, and update your GitHub repository.</p>
            </div>
            
            <div className="content-sections">
              <div className="section">
                <h3>🗺️ Site Structure Planning</h3>
                <p>Plan your site structure, organize pages, and define your content hierarchy.</p>
                <EnhancedSitemap
                  currentModels={currentModels}
                  selectedModelGroupKey={selectedModelGroupKey}
                  setSelectedModelGroupKey={setSelectedModelGroupKey}
                  modelGroups={modelGroups}
                  setModelGroups={setModelGroups}
                  questionnaireData={questionnaireDataForSitemap}
                  setQuestionnaireData={handleQuestionnaireDataChange}
                  onPagesChange={handlePagesChange}
                />
              </div>
              
              <div className="section">
                <h3>✨ Content Generation</h3>
                <p>Generate content based on your questionnaire and sitemap configuration.</p>
                <ContentGenerator
                  pages={sitemapPages}
                  questionnaireData={questionnaireData}
                  siteType={siteType}
                  onContentGenerated={handleContentGenerated}
                />
              </div>
              
              <div className="section">
                <h3>🔄 Update Repository</h3>
                <p>Push generated content and updates to your GitHub repository.</p>
                <RepositoryUpdater
                  pagesContent={generatedContent.pages}
                  globalContent={generatedContent.global}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="workflow-manager">
      <div className="workflow-manager__header">
        <h1>🌐 Site Builder Workflow</h1>
        <p>Follow these steps to build and deploy your site</p>
      </div>

      <div className="workflow-manager__tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab__label">{tab.label}</span>
            <span className="tab__description">{tab.description}</span>
          </button>
        ))}
      </div>

      <div className="workflow-manager__content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default WorkflowManager; 