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
import { useQuestionnaire } from '../../contexts/QuestionnaireProvider';
import { useSitemap } from '../../contexts/SitemapProvider';
import { useWorkflow } from '../../contexts/WorkflowProvider';
import { useAppConfig } from '../../contexts/AppConfigProvider';
import { getBackendSiteTypeForModelGroup } from '../../utils/modelGroupKeyToBackendSiteType';
import '../Common/ProgressIndicator.sass';
import '../Sidebar/SidebarNavigation.sass';
import './WorkflowManager.sass';

const WorkflowManager: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [provisioningData, setProvisioningData] = useState<any>(null);
  const [repoData, setRepoData] = useState<any>(null);

  // Use contexts instead of local state and props
  const { state: questionnaireState } = useQuestionnaire();
  const { state: sitemapState } = useSitemap();
  const { state: workflowState, actions: workflowActions } = useWorkflow();
  const { state: appConfigState } = useAppConfig();

  const questionnaireData = questionnaireState.data;
  const sitemapPages = sitemapState.pages;
  const selectedModelGroupKey = appConfigState.selectedModelGroupKey || Object.keys(appConfigState.modelGroups)[0];
  const modelGroups = appConfigState.modelGroups;

  const currentModels = modelGroups[selectedModelGroupKey]?.models || [];
  const siteType = getBackendSiteTypeForModelGroup(selectedModelGroupKey) || 'stinson';

  const handleRepoCreated = useCallback((data: any) => {
    setRepoData(data);
    workflowActions.updateTaskStatus('infrastructure', 'repoCreation', 'completed');
  }, [workflowActions]);

  const handleProvisioningComplete = useCallback((data: any) => {
    setProvisioningData(data);
    workflowActions.updateTaskStatus('infrastructure', 'awsProvisioning', 'completed');
  }, [workflowActions]);

  const handleQuestionnaireComplete = useCallback(() => {
    workflowActions.updateTaskStatus('setup', 'questionnaire', 'completed');
  }, [workflowActions]);

  const handleContentGenerationComplete = useCallback((pagesContent: object, globalContent: object) => {
    workflowActions.addContent({
      id: `content-${Date.now()}`,
      type: 'page-content',
      title: 'Generated Content',
      content: { pages: pagesContent, global: globalContent },
      created: new Date().toISOString()
    });
    workflowActions.updateTaskStatus('content', 'contentGeneration', 'completed');
  }, [workflowActions]);

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
                <QuestionnaireManager />
              </div>
              
              <div id="task-setup-assetSync" className="section">
                <h3>🖼️ Sync Scraped Assets</h3>
                <p>Upload scraped images to S3 and get CloudFront URLs to prevent hotlinking.</p>
                <EnhancedImageTester 
                  prefilledBucket={provisioningData?.bucketName}
                  prefilledCloudFront={provisioningData?.assets_distribution_url}
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
                <EnhancedSitemap />
              </div>
              
              <div id="task-content-contentGeneration" className="section">
                <h3>✨ Content Generation</h3>
                <p>Generate content based on your questionnaire and sitemap configuration.</p>
                <ContentGenerator
                  onContentGenerated={handleContentGenerationComplete}
                />
              </div>
              
              <div id="task-content-repositoryUpdate" className="section">
                <h3>🔄 Update Repository</h3>
                <p>Push generated content and updates to your GitHub repository.</p>
                <RepositoryUpdater />
              </div>
              
              <div id="task-content-wordpressUpdate" className="section">
                <h3>🌐 Update WordPress</h3>
                <p>Push generated content directly to your WordPress site via the REST API.</p>
                <WordPressUpdater />
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