import { useState } from 'react'

interface ViewControlsState {
  viewMode: 'grid' | 'list'
  showSelect: boolean
  showTextarea: boolean
  showDeleteButtons: boolean
  showItemNumbers: boolean
  showPageIds: boolean
  usePageJson: boolean
  useGridLayout: boolean
  gridColumnWidth: number
}

const defaultViewControls: ViewControlsState = {
  viewMode: 'grid',
  showSelect: true,
  showTextarea: true,
  showDeleteButtons: false,
  showItemNumbers: false,
  showPageIds: false,
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
    setGridColumnWidth
  }
}

export default useViewControls