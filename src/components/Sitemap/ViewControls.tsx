import React from 'react';
import { useSitemap } from '../../contexts/SitemapProvider';

const ViewControls: React.FC = () => {
  const { state, actions } = useSitemap();
  const {
    showSelect,
    showTextarea,
    showDeleteButtons,
    showItemNumbers,
    showPageIds
  } = state;
  const {
    toggleShowSelect,
    toggleShowTextarea,
    toggleShowDeleteButtons,
    toggleShowItemNumbers,
    toggleShowPageIds
  } = actions;

  return (
    <div className="mb-4">
      {/* Individual Controls */}
      <div className="flex flex-wrap gap-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={showSelect}
          onChange={toggleShowSelect}
          className="form-checkbox h-4 w-4"
          aria-label="Show Model Selectors"
        />
        <span>Show Model Selectors</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={showTextarea}
          onChange={toggleShowTextarea}
          className="form-checkbox h-4 w-4"
          aria-label="Show Query Inputs"
        />
        <span>Show Query Inputs</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={showDeleteButtons}
          onChange={toggleShowDeleteButtons}
          className="form-checkbox h-4 w-4"
          aria-label="Show Delete Buttons"
        />
        <span>Show Delete Buttons</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={showItemNumbers}
          onChange={toggleShowItemNumbers}
          className="form-checkbox h-4 w-4"
          aria-label="Show Item Numbers"
        />
        <span>Show Item Numbers</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={showPageIds}
          onChange={toggleShowPageIds}
          className="form-checkbox h-4 w-4"
          aria-label="Show Page IDs"
        />
        <span>Show Page IDs</span>
      </label>
      </div>
    </div>
  );
};

export default ViewControls; 