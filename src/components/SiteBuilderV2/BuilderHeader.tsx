import React from 'react';
import './BuilderHeader.sass';

interface BuilderHeaderProps {
  activeTab: 'sitemap' | 'wireframe' | 'style-guide' | 'design';
  onTabChange: (tab: 'sitemap' | 'wireframe' | 'style-guide' | 'design') => void;
}

const BuilderHeader: React.FC<BuilderHeaderProps> = ({ activeTab, onTabChange }) => {
  const handleTabClick = (tab: 'sitemap' | 'wireframe' | 'style-guide' | 'design') => {
    onTabChange(tab);
  };

  const handleTabKeyDown = (e: React.KeyboardEvent, tab: 'sitemap' | 'wireframe' | 'style-guide' | 'design') => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTabChange(tab);
    }
  };

  return (
    <header className="builder-header">
      <nav className="builder-header__tabs" role="tablist">
        <button
          className={`builder-header__tab ${activeTab === 'sitemap' ? 'builder-header__tab--active' : ''}`}
          onClick={() => handleTabClick('sitemap')}
          onKeyDown={(e) => handleTabKeyDown(e, 'sitemap')}
          role="tab"
          aria-selected={activeTab === 'sitemap'}
          aria-label="Sitemap"
        >
          Sitemap
        </button>
        <button
          className={`builder-header__tab ${activeTab === 'wireframe' ? 'builder-header__tab--active' : ''}`}
          onClick={() => handleTabClick('wireframe')}
          onKeyDown={(e) => handleTabKeyDown(e, 'wireframe')}
          role="tab"
          aria-selected={activeTab === 'wireframe'}
          aria-label="Wireframe"
        >
          Wireframe
        </button>
        <button
          className={`builder-header__tab ${activeTab === 'style-guide' ? 'builder-header__tab--active' : ''}`}
          onClick={() => handleTabClick('style-guide')}
          onKeyDown={(e) => handleTabKeyDown(e, 'style-guide')}
          role="tab"
          aria-selected={activeTab === 'style-guide'}
          aria-label="Style Guide"
        >
          Style Guide
        </button>
      </nav>
    </header>
  );
};

export default BuilderHeader;

