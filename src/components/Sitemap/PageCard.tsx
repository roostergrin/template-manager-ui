import React from 'react';
import { SitemapSection, SitemapItem } from '../../types/SitemapTypes';
import SitemapSectionComponent from '../SitemapSection/SitemapSection';
import { useSitemap } from '../../contexts/SitemapProvider';
import { useAppConfig } from '../../contexts/AppConfigProvider';

type PageCardProps = {
  page: SitemapSection;
  index: number;
  showItemNumbers?: boolean;
  showPageIds?: boolean;
  showDeleteButtons?: boolean;
  showSelect?: boolean;
  showTextarea?: boolean;
};

const PageCard: React.FC<PageCardProps> = ({
  page,
  index,
  showItemNumbers = true,
  showPageIds = false,
  showDeleteButtons = true,
  showSelect = false,
  showTextarea = false,
}) => {
  const { actions: sitemapActions } = useSitemap();
  const { state: appConfigState } = useAppConfig();
  
  const selectedModelGroupKey = appConfigState.selectedModelGroupKey || Object.keys(appConfigState.modelGroups)[0];
  const currentModels = appConfigState.modelGroups[selectedModelGroupKey]?.models || [];
  return (
    <div className="app__page app__page--compact">
      <div className="app__page-header flex items-center gap-2 mb-2">
        {showItemNumbers && (
          <span className="app__page-number font-mono text-xs text-gray-500">{`${index + 1}.0`}</span>
        )}
        <input
          type="text"
          className="app__page-title-input border rounded px-2 py-1 text-sm"
          value={page.title}
          onChange={e => sitemapActions.updatePageTitle(page.id, e.target.value)}
          placeholder="Page Title"
          aria-label="Page Title"
        />
        <div className="flex items-center gap-2 ml-auto">
          {showPageIds && (
            <input
              type="text"
              className="app__page-wordpress-id-input border rounded px-2 py-1 text-xs"
              placeholder="Page ID"
              value={page.wordpress_id || ''}
              onChange={e => sitemapActions.updatePageWordpressId(page.id, e.target.value)}
              aria-label="Page ID"
            />
          )}
          {showDeleteButtons && (
            <button
              className="app__delete-page-button bg-red-100 text-red-600 rounded px-2 py-1 text-xs hover:bg-red-200"
              onClick={() => sitemapActions.removePage(page.id)}
              aria-label="Delete Page"
              tabIndex={0}
            >
              -
            </button>
          )}
        </div>
      </div>
      <SitemapSectionComponent
        models={currentModels}
        pageID={page.id}
        title={page.title}
        pageNumber={index + 1}
        items={page.items}
        showSelect={showSelect}
        showTextarea={showTextarea}
        showDeleteButtons={showDeleteButtons}
        showItemNumbers={showItemNumbers}
        onItemsChange={newItems => sitemapActions.updatePageItems(page.id, newItems)}
      />
    </div>
  );
};

export default PageCard; 