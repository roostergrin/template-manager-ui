import React from 'react';
import BuilderHeader from './BuilderHeader';
import LandingPageWireframe from './LandingPageWireframe';
import './BuilderCanvas.sass';

interface BuilderCanvasProps {
  projectType: 'landing-page' | 'website';
  activeTab: 'sitemap' | 'wireframe' | 'style-guide' | 'design';
  onTabChange: (tab: 'sitemap' | 'wireframe' | 'style-guide' | 'design') => void;
}

const BuilderCanvas: React.FC<BuilderCanvasProps> = ({ 
  projectType, 
  activeTab, 
  onTabChange 
}) => {
  return (
    <main className="builder-canvas">
      {/* Only show header tabs for website projects */}
      {projectType === 'website' && (
        <BuilderHeader activeTab={activeTab} onTabChange={onTabChange} />
      )}
      
      <div className="builder-canvas__content">
        {projectType === 'landing-page' ? (
          <LandingPageWireframe />
        ) : (
          <div className="builder-canvas__placeholder">
            <div className="builder-canvas__placeholder-icon">🌐</div>
            <p className="builder-canvas__placeholder-text">
              Select a page to start editing
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default BuilderCanvas;

