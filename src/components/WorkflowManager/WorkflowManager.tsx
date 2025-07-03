import React, { useState, useCallback } from 'react';
import QuestionnaireManager from '../QuestionnaireManager/QuestionnaireManager';
import EnhancedSitemap from './EnhancedSitemap';
import EnhancedProvisionSection from './EnhancedProvisionSection';
import EnhancedImageTester from './EnhancedImageTester';
import GitHubRepoCreator from './GitHubRepoCreator';
import ContentGenerator from './ContentGenerator';
import RepositoryUpdater from './RepositoryUpdater';
import WordPressUpdater from './WordPressUpdater';
import SidebarNavigation from '../Sidebar/SidebarNavigation';
import { QuestionnaireData } from '../../types/SitemapTypes';
import { initialModelGroups } from '../../modelGroups';
import { getBackendSiteTypeForModelGroup } from '../../utils/modelGroupKeyToBackendSiteType';
import useProgressTracking from '../../hooks/useProgressTracking';
import '../Common/ProgressIndicator.sass';
import '../Sidebar/SidebarNavigation.sass';
import './WorkflowManager.sass';

interface WorkflowManagerProps {
  questionnaireData: Record<string, unknown>;
  setQuestionnaireData: (data: Record<string, unknown>) => void;
}

const WorkflowManager: React.FC<WorkflowManagerProps> = ({
  questionnaireData,
  setQuestionnaireData
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const { activeSection, updateTaskStatus } = useProgressTracking();
  const [modelGroups, setModelGroups] = useState<Record<string, string[]>>(initialModelGroups);
  const [selectedModelGroupKey, setSelectedModelGroupKey] = useState<string>(Object.keys(initialModelGroups)[0]);
  const [provisioningData, setProvisioningData] = useState<any>(null);
  const [repoData, setRepoData] = useState<any>(null);
  const [generatedContent, setGeneratedContent] = useState<{
    pages: object | null;
    global: object | null;
  }>({ pages: null, global: null });
  const [sitemapPages, setSitemapPages] = useState<any[]>([]);

  const handlePagesChange = useCallback((pages: any[]) => {
    setSitemapPages(pages);
  }, []);

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

  const handleContentGenerated = useCallback((pagesContent: object, globalContent: object) => {
    setGeneratedContent({
      pages: pagesContent,
      global: globalContent
    });
  }, []);

  const currentModels = initialModelGroups[selectedModelGroupKey] || [];
  const siteType = getBackendSiteTypeForModelGroup(selectedModelGroupKey) || 'stinson';

  const handleRepoCreated = useCallback((data: any) => {
    setRepoData(data);
    updateTaskStatus('infrastructure', 'repoCreation', 'completed');
  }, [updateTaskStatus]);

  const handleProvisioningComplete = useCallback((data: any) => {
    setProvisioningData(data);
    updateTaskStatus('infrastructure', 'awsProvisioning', 'completed');
  }, [updateTaskStatus]);

  const handleQuestionnaireComplete = useCallback(() => {
    updateTaskStatus('setup', 'questionnaire', 'completed');
  }, [updateTaskStatus]);

  const handleContentGenerationComplete = useCallback((pagesContent: object, globalContent: object) => {
    setGeneratedContent({
      pages: pagesContent,
      global: globalContent
    });
    updateTaskStatus('content', 'contentGeneration', 'completed');
  }, [updateTaskStatus]);

  const renderSectionContent = () => {
    return (
      <div className="workflow-sections">
        <div id="section-infrastructure" className="workflow-section">
          <div className="tab-content">
            <div className="tab-content__header">
              <h2>🏗️ Infrastructure & Assets</h2>
              <p>First, create your GitHub repository and provision AWS infrastructure for hosting and assets.</p>
            </div>
            
            <div className="infrastructure-sections">
              <div id="task-infrastructure-repoCreation" className="section">
                <h3>📁 Create GitHub Repository</h3>
                <p>Create a new GitHub repository from template to host your site code.</p>
                <GitHubRepoCreator onRepoCreated={handleRepoCreated} />
              </div>
              
              <div id="task-infrastructure-awsProvisioning" className="section">
                <h3>☁️ Provision AWS Resources</h3>
                <p>Create S3 bucket, CloudFront distribution, and CodePipeline for your site.</p>
                <EnhancedProvisionSection 
                  onProvisioningComplete={handleProvisioningComplete}
                />
              </div>
            </div>
          </div>
        </div>

        <div id="section-setup" className="workflow-section">
          <div className="tab-content">
            <div className="tab-content__header">
              <h2>📝 Setup & Configuration</h2>
              <p>Configure your site settings, fill out the questionnaire, add content documents, and sync scraped assets.</p>
            </div>
            
            <div className="setup-sections">
              <div id="task-setup-questionnaire" className="section">
                <h3>📋 Site Questionnaire</h3>
                <p>Fill out the questionnaire to configure your site's basic settings and content preferences.</p>
                <QuestionnaireManager 
                  formData={questionnaireData} 
                  setFormData={setQuestionnaireData} 
                />
              </div>
              
              <div id="task-setup-assetSync" className="section">
                <h3>🖼️ Sync Scraped Assets</h3>
                <p>Upload scraped images to S3 and get CloudFront URLs to prevent hotlinking.</p>
                <EnhancedImageTester 
                  prefilledBucket={provisioningData?.bucketName}
                  prefilledCloudFront={provisioningData?.assets_distribution_url}
                  questionnaireData={questionnaireData}
                />
              </div>
            </div>
          </div>
        </div>

        <div id="section-content" className="workflow-section">
          <div className="tab-content">
            <div className="tab-content__header">
              <h2>🗺️ Content Planning & Generation</h2>
              <p>Plan your site structure, organize pages, generate content, and update your GitHub repository.</p>
            </div>
            
            <div className="content-sections">
              <div id="task-content-sitemapPlanning" className="section">
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
              
              <div id="task-content-contentGeneration" className="section">
                <h3>✨ Content Generation</h3>
                <p>Generate content based on your questionnaire and sitemap configuration.</p>
                <ContentGenerator
                  pages={sitemapPages}
                  questionnaireData={questionnaireData}
                  siteType={siteType}
                  onContentGenerated={handleContentGenerationComplete}
                />
              </div>
              
              <div id="task-content-repositoryUpdate" className="section">
                <h3>🔄 Update Repository</h3>
                <p>Push generated content and updates to your GitHub repository.</p>
                <RepositoryUpdater
                  pagesContent={generatedContent.pages}
                  globalContent={generatedContent.global}
                />
              </div>
              
              <div id="task-content-wordpressUpdate" className="section">
                <h3>🌐 Update WordPress</h3>
                <p>Push generated content directly to your WordPress site via the REST API.</p>
                <WordPressUpdater
                  pagesContent={generatedContent.pages}
                  globalContent={generatedContent.global}
                  sitemapData={{ pages: sitemapPages }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="workflow-manager">
      <SidebarNavigation 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <div className={`workflow-manager__main ${isSidebarCollapsed ? 'workflow-manager__main--expanded' : ''}`}>
        <div className="workflow-manager__content">
          {renderSectionContent()}
        </div>
      </div>
    </div>
  );
};

export default WorkflowManager; 