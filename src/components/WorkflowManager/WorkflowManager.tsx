import React, { useState, useCallback } from 'react';
import { Server, Cloud, Copy, Settings, FileText, Image, Map, Sparkles, RefreshCw, Globe, Zap, Folder } from 'lucide-react';
import QuestionnaireManager from '../QuestionnaireManager/QuestionnaireManager';
import EnhancedSitemap from './EnhancedSitemap';
import EnhancedProvisionSection from './EnhancedProvisionSection';
import ProvisionWordPressSection from './ProvisionWordPressSection';
import CopyToTemplatesSection from './CopyToTemplatesSection';
import EnhancedImageTester from './EnhancedImageTester';
import GitHubRepoCreator from './GitHubRepoCreator';
import ContentGenerator from './ContentGenerator';
import RepositoryUpdater from './RepositoryUpdater';
import WordPressUpdater from './WordPressUpdater';
import GithubFileUpdater from '../GithubFileUpdater';
import InfrastructureSetup from '../InfrastructureSetup';
import SidebarNavigation from '../Sidebar/SidebarNavigation';
import { useQuestionnaire } from '../../contexts/QuestionnaireProvider';
// import { useSitemap } from '../../contexts/SitemapProvider';
import { useWorkflow } from '../../contexts/WorkflowProvider';
// import { useAppConfig } from '../../contexts/AppConfigProvider';
// import { getBackendSiteTypeForModelGroup } from '../../utils/modelGroupKeyToBackendSiteType';
import '../Common/ProgressIndicator.sass';
import '../Sidebar/SidebarNavigation.sass';
import './WorkflowManager.sass';

const WorkflowManager: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [provisioningData, setProvisioningData] = useState<any>(null);
  // const [repoData, setRepoData] = useState<any>(null);

  // Use contexts instead of local state and props
  const { state: questionnaireState } = useQuestionnaire();
  // const { state: sitemapState } = useSitemap();
  const { actions: workflowActions } = useWorkflow();
  // const { state: appConfigState, actions: appConfigActions } = useAppConfig();

  // const questionnaireData = questionnaireState.data;
  // const sitemapPages = sitemapState.pages;
  // const selectedModelGroupKey = appConfigState.selectedModelGroupKey || Object.keys(appConfigState.modelGroups)[0];
  // const modelGroups = appConfigState.modelGroups;

  // const currentModels = modelGroups[selectedModelGroupKey]?.models || [];
  // const siteType = getBackendSiteTypeForModelGroup(selectedModelGroupKey) || 'stinson';

  const handleRepoCreated = useCallback(() => {
    // setRepoData(data);
    workflowActions.updateTaskStatus('infrastructure', 'repoCreation', 'completed');
  }, [workflowActions]);

  const handleProvisioningComplete = useCallback((data: any) => {
    setProvisioningData(data);
    workflowActions.updateTaskStatus('infrastructure', 'awsProvisioning', 'completed');
  }, [workflowActions]);

  // const handleQuestionnaireComplete = useCallback(() => {
  //   workflowActions.updateTaskStatus('planning', 'questionnaire', 'completed');
  // }, [workflowActions]);

  const handleContentGenerationComplete = useCallback((pagesContent: object, globalContent: object) => {
    // Check if content already exists to prevent duplicates
    const existingContent = workflowActions.getContentByType('page-content');
    if (existingContent.length > 0) {
      // Update existing content instead of adding new
      workflowActions.updateGeneratedContent(existingContent[0].id, {
        content: { pages: pagesContent, global: globalContent },
      });
    } else {
      workflowActions.addGeneratedContent({
        type: 'page-content',
        title: 'Generated Content',
        content: { pages: pagesContent, global: globalContent },
        metadata: {},
      });
    }
    workflowActions.updateTaskStatus('planning', 'contentGeneration', 'completed');
  }, [workflowActions]);

  const renderSectionContent = () => {
    return (
      <div className="workflow-sections">
        <div id="section-infrastructure" className="workflow-section">
          <div className="tab-content">
            {/* New Unified Infrastructure Setup */}
            <InfrastructureSetup />

            {/* Old Infrastructure Sections - Kept for reference, uncomment if needed */}
            {/*
            <div className="tab-content__header">
              <div className="tab-content__header-title">
                <Server size={24} strokeWidth={2} />
                <h2>Infrastructure Setup</h2>
              </div>
              <p>Create your GitHub repository and provision AWS infrastructure for hosting and assets.</p>
            </div>

            <div className="infrastructure-sections">
              <div id="task-infrastructure-repoCreation" className="section">
                <div className="section__header">
                  <Folder size={20} strokeWidth={2} />
                  <h3>Create GitHub Repository</h3>
                </div>
                <p>Create a new GitHub repository from template to host your site code.</p>
                <GitHubRepoCreator onRepoCreated={handleRepoCreated} />
              </div>

              <div id="task-infrastructure-awsProvisioning" className="section">
                <div className="section__header">
                  <Cloud size={20} strokeWidth={2} />
                  <h3>Provision AWS Resources</h3>
                </div>
                <p>Create S3 bucket, CloudFront distribution, and CodePipeline for your site.</p>
                <EnhancedProvisionSection
                  onProvisioningComplete={handleProvisioningComplete}
                />
              </div>
              <div id="task-infrastructure-copyToTemplates" className="section">
                <div className="section__header">
                  <Copy size={20} strokeWidth={2} />
                  <h3>Copy to roostergrintemplates.com</h3>
                </div>
                <p>Copy an existing subdomain to create a new subdomain under roostergrintemplates.com.</p>
                <CopyToTemplatesSection />
              </div>
              <div id="task-infrastructure-pleskProvisioning" className="section">
                <div className="section__header">
                  <Settings size={20} strokeWidth={2} />
                  <h3>Provision WordPress (Plesk)</h3>
                </div>
                <p>Create a Plesk subscription and prepare a WordPress instance for the site.</p>
                <ProvisionWordPressSection />
              </div>
            </div>
            */}
          </div>
        </div>

        <div id="section-planning" className="workflow-section">
          <div className="tab-content">
            <div className="tab-content__header">
              <div className="tab-content__header-title">
                <FileText size={24} strokeWidth={2} />
                <h2>Planning & Content Generation</h2>
              </div>
              <p>Configure your site settings, plan your structure, generate content, and sync scraped assets.</p>
            </div>
            
            <div className="planning-sections">
              <div id="task-planning-questionnaire" className="section">
                <div className="section__header">
                  <FileText size={20} strokeWidth={2} />
                  <h3>Site Questionnaire</h3>
                </div>
                <p>Fill out the questionnaire to configure your site's basic settings and content preferences.</p>
                <QuestionnaireManager />
              </div>
              
              {questionnaireState.activeMode === 'scrape' && (
                <div id="task-planning-assetSync" className="section">
                  <div className="section__header">
                    <Image size={20} strokeWidth={2} />
                    <h3>Sync Scraped Assets</h3>
                  </div>
                  <p>Upload scraped images to S3 and get CloudFront URLs to prevent hotlinking.</p>
                  <EnhancedImageTester 
                    prefilledBucket={provisioningData?.bucketName}
                    prefilledCloudFront={provisioningData?.assets_distribution_url}
                  />
                </div>
              )}
              
              <div id="task-planning-sitemapPlanning" className="section">
                <div className="section__header">
                  <Map size={20} strokeWidth={2} />
                  <h3>Site Structure Planning</h3>
                </div>
                <p>Plan your site structure, organize pages, and define your content hierarchy.</p>
                <EnhancedSitemap />
              </div>
              
              <div id="task-planning-contentGeneration" className="section">
                <div className="section__header">
                  <Sparkles size={20} strokeWidth={2} />
                  <h3>Content Generation</h3>
                </div>
                <p>Generate content based on your questionnaire and sitemap configuration.</p>
                <ContentGenerator
                  onContentGenerated={handleContentGenerationComplete}
                />
              </div>
            </div>
          </div>
        </div>

        <div id="section-deployment" className="workflow-section">
          <div className="tab-content">
            <div className="tab-content__header">
              <div className="tab-content__header-title">
                <RefreshCw size={24} strokeWidth={2} />
                <h2>Deployment & Updates</h2>
              </div>
              <p>Deploy your generated content to GitHub repository and WordPress site.</p>
            </div>
            
            <div className="deployment-sections">
              {questionnaireState.activeMode === 'template-markdown' && (
                <div id="task-deployment-repositoryUpdate" className="section">
                  <div className="section__header">
                    <RefreshCw size={20} strokeWidth={2} />
                    <h3>Update Repository</h3>
                  </div>
                  <p>Push generated content and updates to your GitHub repository.</p>
                  <RepositoryUpdater />
                </div>
              )}
              
              <div id="task-deployment-wordpressUpdate" className="section">
                <div className="section__header">
                  <Globe size={20} strokeWidth={2} />
                  <h3>Update WordPress</h3>
                </div>
                <p>Push generated content directly to your WordPress site via the REST API.</p>
                <WordPressUpdater />
              </div>
              
              <div id="task-deployment-frontendUpdate" className="section">
                <div className="section__header">
                  <Zap size={20} strokeWidth={2} />
                  <h3>Frontend Updates</h3>
                </div>
                <p>Update individual files in your GitHub repository for frontend customizations.</p>
                <GithubFileUpdater />
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
