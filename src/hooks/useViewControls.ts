import { useState } from 'react'

interface ViewControlsState {
  viewMode: 'grid' | 'list'
  layoutType: 'standard' | 'toc'
  showSelect: boolean
  showTextarea: boolean
  showDeleteButtons: boolean
  showItemNumbers: boolean
  showPageIds: boolean
  showItems: boolean
  usePageJson: boolean
  useGridLayout: boolean
  gridColumnWidth: number
}

const defaultViewControls: ViewControlsState = {
  viewMode: 'grid',
  layoutType: 'toc',
  showSelect: true,
  showTextarea: true,
  showDeleteButtons: true,
  showItemNumbers: true,
  showPageIds: true,
  showItems: true,
  usePageJson: false,
  useGridLayout: true,
  gridColumnWidth: 175
}

const useViewControls = (initialState: Partial<ViewControlsState> = {}) => {
  const [viewControls, setViewControls] = useState<ViewControlsState>({
    ...defaultViewControls,
    ...initialState
  })

  const setViewMode = (mode: 'grid' | 'list') => {
    setViewControls(prev => ({ ...prev, viewMode: mode }))
  }

  const toggleShowSelect = () => {
    setViewControls(prev => ({ ...prev, showSelect: !prev.showSelect }))
  }

  const toggleShowTextarea = () => {
    setViewControls(prev => ({ ...prev, showTextarea: !prev.showTextarea }))
  }

  const toggleShowDeleteButtons = () => {
    setViewControls(prev => ({ ...prev, showDeleteButtons: !prev.showDeleteButtons }))
  }

  const toggleShowItemNumbers = () => {
    setViewControls(prev => ({ ...prev, showItemNumbers: !prev.showItemNumbers }))
  }

  const toggleShowPageIds = () => {
    setViewControls(prev => ({ ...prev, showPageIds: !prev.showPageIds }))
  }

  const toggleUsePageJson = () => {
    setViewControls(prev => ({ ...prev, usePageJson: !prev.usePageJson }))
  }

  const toggleUseGridLayout = () => {
    setViewControls(prev => ({ ...prev, useGridLayout: !prev.useGridLayout }))
  }

  const setGridColumnWidth = (width: number) => {
    setViewControls(prev => ({ ...prev, gridColumnWidth: width }))
  }

  const setShowItems = (show: boolean) => {
    setViewControls(prev => ({ ...prev, showItems: show }))
  }

  const setLayoutType = (type: 'standard' | 'toc') => {
    setViewControls(prev => ({ ...prev, layoutType: type }))
  }

  const toggleLayoutType = () => {
    setViewControls(prev => ({ ...prev, layoutType: prev.layoutType === 'standard' ? 'toc' : 'standard' }))
  }

  return {
    ...viewControls,
    setViewMode,
    toggleShowSelect,
    toggleShowTextarea,
    toggleShowDeleteButtons,
    toggleShowItemNumbers,
    toggleShowPageIds,
    toggleUsePageJson,
    toggleUseGridLayout,
    setGridColumnWidth,
    setShowItems,
    setLayoutType,
    toggleLayoutType
  }
}

export default useViewControls