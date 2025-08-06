import { useState } from 'react'

export interface UserPreferences {
  defaultModelGroup?: string
  defaultTemplate?: string
  preferredViewMode: 'grid' | 'list'
  showAdvancedOptions: boolean
  hideDisabledTemplates: boolean
  compactMode: boolean
}

const defaultUserPreferences: UserPreferences = {
  defaultModelGroup: undefined,
  defaultTemplate: undefined,
  preferredViewMode: 'grid',
  showAdvancedOptions: false,
  hideDisabledTemplates: true,
  compactMode: false
}

export const useUserPreferences = (initialPreferences: UserPreferences = defaultUserPreferences) => {
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(initialPreferences)

  const updateUserPreferences = (updates: Partial<UserPreferences>) => {
    setUserPreferences(prev => ({
      ...prev,
      ...updates
    }))
  }

  const resetUserPreferences = () => {
    setUserPreferences(defaultUserPreferences)
  }

  const setDefaultModelGroup = (modelGroup: string | undefined) => {
    updateUserPreferences({ defaultModelGroup: modelGroup })
  }

  const setDefaultTemplate = (template: string | undefined) => {
    updateUserPreferences({ defaultTemplate: template })
  }

  const setPreferredViewMode = (viewMode: UserPreferences['preferredViewMode']) => {
    updateUserPreferences({ preferredViewMode: viewMode })
  }

  const toggleViewMode = () => {
    setUserPreferences(prev => ({
      ...prev,
      preferredViewMode: prev.preferredViewMode === 'grid' ? 'list' : 'grid'
    }))
  }

  const toggleAdvancedOptions = () => {
    setUserPreferences(prev => ({
      ...prev,
      showAdvancedOptions: !prev.showAdvancedOptions
    }))
  }

  const toggleHideDisabledTemplates = () => {
    setUserPreferences(prev => ({
      ...prev,
      hideDisabledTemplates: !prev.hideDisabledTemplates
    }))
  }

  const toggleCompactMode = () => {
    setUserPreferences(prev => ({
      ...prev,
      compactMode: !prev.compactMode
    }))
  }

  const setAllUserPreferences = (newPreferences: UserPreferences) => {
    setUserPreferences(newPreferences)
  }

  return {
    userPreferences,
    updateUserPreferences,
    resetUserPreferences,
    setDefaultModelGroup,
    setDefaultTemplate,
    setPreferredViewMode,
    toggleViewMode,
    toggleAdvancedOptions,
    toggleHideDisabledTemplates,
    toggleCompactMode,
    setAllUserPreferences
  }
}