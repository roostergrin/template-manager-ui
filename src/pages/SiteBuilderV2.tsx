import React, { useState } from 'react';
import ProjectTypeSelector from './ProjectTypeSelector';
import BuilderSidePanel from '../components/SiteBuilderV2/BuilderSidePanel';
import BuilderCanvas from '../components/SiteBuilderV2/BuilderCanvas';
import { LandingPageProvider } from '../components/SiteBuilderV2/LandingPageContext';
import './SiteBuilderV2.sass';

type ProjectType = 'landing-page' | 'website' | null;

const SiteBuilderV2: React.FC = () => {
  const [projectType, setProjectType] = useState<ProjectType>(null);
  const [activeTab, setActiveTab] = useState<'sitemap' | 'wireframe' | 'style-guide' | 'design'>('sitemap');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const handleProjectTypeSelect = (type: 'landing-page' | 'website') => {
    setProjectType(type);
  };

  const handleTabChange = (tab: 'sitemap' | 'wireframe' | 'style-guide' | 'design') => {
    setActiveTab(tab);
  };

  // Show project type selector if no type selected yet
  if (!projectType) {
    return <ProjectTypeSelector onSelectType={handleProjectTypeSelect} />;
  }

  return (
    <LandingPageProvider>
      <div className="site-builder">
        <div className="site-builder__main">
          <BuilderSidePanel 
            projectType={projectType}
            isCollapsed={isPanelCollapsed}
            onToggle={() => setIsPanelCollapsed(!isPanelCollapsed)}
          />
          
          <BuilderCanvas 
            projectType={projectType}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>
      </div>
    </LandingPageProvider>
  );
};

export default SiteBuilderV2;
