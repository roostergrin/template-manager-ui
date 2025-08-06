import React from 'react';
import { useSitemap } from '../../contexts/SitemapProvider';

const LayoutControls: React.FC = () => {
  const { state, actions } = useSitemap();
  const { useGridLayout, gridColumnWidth } = state;
  const { toggleUseGridLayout, setGridColumnWidth } = actions;
  return (
    <div className="flex items-center gap-6 mb-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={useGridLayout}
          onChange={toggleUseGridLayout}
          className="form-checkbox h-4 w-4"
          aria-label="Use Grid Layout"
        />
        <span>Use Grid Layout</span>
      </label>
      {useGridLayout && (
        <label className="flex items-center gap-2">
          <span>Grid Column Width: {gridColumnWidth}px</span>
          <input
            type="range"
            min={100}
            max={550}
            step={25}
            value={gridColumnWidth}
            onChange={e => setGridColumnWidth(Number(e.target.value))}
            className="w-40"
            aria-label="Grid Column Width"
          />
        </label>
      )}
    </div>
  );
};

export default LayoutControls; 