import { useState, useCallback } from 'react';

const useViewControls = () => {
  const [showSelect, setShowSelect] = useState<boolean>(true);
  const [showTextarea, setShowTextarea] = useState<boolean>(false);
  const [showDeleteButtons, setShowDeleteButtons] = useState<boolean>(false);
  const [showItemNumbers, setShowItemNumbers] = useState<boolean>(false);
  const [showPageIds, setShowPageIds] = useState<boolean>(false);
  const [useGridLayout, setUseGridLayout] = useState<boolean>(true);
  const [gridColumnWidth, setGridColumnWidth] = useState<number>(175);
  const [usePageJson, setUsePageJson] = useState<boolean>(false);

  return {
    usePageJson,
    toggleUsePageJson: useCallback(() => setUsePageJson(prev => !prev), []),
    showSelect,
    toggleShowSelect: useCallback(() => setShowSelect(prev => !prev), []),
    showTextarea,
    toggleShowTextarea: useCallback(() => setShowTextarea(prev => !prev), []),
    showDeleteButtons,
    toggleShowDeleteButtons: useCallback(() => setShowDeleteButtons(prev => !prev), []),
    showItemNumbers,
    toggleShowItemNumbers: useCallback(() => setShowItemNumbers(prev => !prev), []),
    showPageIds,
    toggleShowPageIds: useCallback(() => setShowPageIds(prev => !prev), []),
    useGridLayout,
    toggleUseGridLayout: useCallback(() => setUseGridLayout(prev => !prev), []),
    gridColumnWidth,
    setGridColumnWidth,
  };
};

export default useViewControls; 