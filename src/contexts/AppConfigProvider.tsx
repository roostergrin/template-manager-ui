import React, { createContext, useContext, useCallback, ReactNode, useEffect } from 'react'
import { ModelGroup, TemplateInfo, modelGroups as defaultModelGroups } from '../modelGroups'
import { useModelGroups } from '../hooks/appConfig/useModelGroups'
import { useAppSettings, AppSettings } from '../hooks/appConfig/useAppSettings'
import { useUserPreferences, UserPreferences } from '../hooks/appConfig/useUserPreferences'
import { useTemplateSelection } from '../hooks/appConfig/useTemplateSelection'
import { useAppState } from '../hooks/appConfig/useAppState'

// Re-export types for convenience
export type { AppSettings, UserPreferences }

// Context State Types
interface AppConfigContextState {
  modelGroups: Record<string, ModelGroup>
  selectedModelGroupKey: string | null
  selectedTemplateKey: string | null
  settings: AppSettings
  userPreferences: UserPreferences
  isLoading: boolean
  error: string | null
  lastSaved: string | null
}

// Context Actions
interface AppConfigContextActions {
  // Model Group Management
  setSelectedModelGroup: (key: string | null) => void
  setSelectedTemplate: (key: string | null) => void
  updateModelGroup: (key: string, updates: Partial<ModelGroup>) => void
  addModelGroup: (key: string, modelGroup: ModelGroup) => void
  removeModelGroup: (key: string) => void
  toggleModelGroupEnabled: (key: string) => void
  getEnabledModelGroups: () => Record<string, ModelGroup>
  getModelGroupByKey: (key: string) => ModelGroup | undefined
  getTemplateByKey: (modelGroupKey: string, templateKey: string) => TemplateInfo | undefined

  // Settings Management
  updateSettings: (updates: Partial<AppSettings>) => void
  resetSettings: () => void
  
  // User Preferences Management
  updateUserPreferences: (updates: Partial<UserPreferences>) => void
  resetUserPreferences: () => void
  
  // Utility Actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  exportConfig: () => string
  importConfig: (configJson: string) => void
  resetAllConfig: () => void
}

interface AppConfigContextValue {
  state: AppConfigContextState
  actions: AppConfigContextActions
}

// Constants
const STORAGE_KEY = 'template-manager-app-config'

// Load from localStorage
const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.warn('Failed to load app config from localStorage:', error)
  }
  return null
}

// Save to localStorage
const saveToStorage = (data: {
  selectedModelGroupKey: string | null
  selectedTemplateKey: string | null
  settings: AppSettings
  userPreferences: UserPreferences
  modelGroups: Record<string, ModelGroup>
}) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.warn('Failed to save app config to localStorage:', error)
  }
}


// Context
const AppConfigContext = createContext<AppConfigContextValue | undefined>(undefined)

// Provider Props
interface AppConfigProviderProps {
  children: ReactNode
  initialState?: Partial<AppConfigContextState>
}

// Provider Component
export const AppConfigProvider: React.FC<AppConfigProviderProps> = ({
  children,
  initialState: providedInitialState
}) => {
  // Initialize hooks with saved data or defaults
  const savedData = loadFromStorage()
  
  const modelGroupsHook = useModelGroups(
    savedData?.modelGroups || providedInitialState?.modelGroups || defaultModelGroups
  )
  
  const settingsHook = useAppSettings(
    savedData?.settings || providedInitialState?.settings
  )
  
  const preferencesHook = useUserPreferences(
    savedData?.userPreferences || providedInitialState?.userPreferences
  )
  
  const templateSelectionHook = useTemplateSelection(
    savedData?.selectedTemplateKey || providedInitialState?.selectedTemplateKey || null
  )
  
  const appStateHook = useAppState()

  // Sync selectedModelGroupKey from modelGroups hook and saved data
  useEffect(() => {
    const savedModelGroupKey = savedData?.selectedModelGroupKey || providedInitialState?.selectedModelGroupKey
    if (savedModelGroupKey) {
      modelGroupsHook.setSelectedModelGroup(savedModelGroupKey)
    }
  }, [])

  // Save to localStorage when state changes
  useEffect(() => {
    const dataToSave = {
      selectedModelGroupKey: modelGroupsHook.selectedModelGroupKey,
      selectedTemplateKey: templateSelectionHook.selectedTemplateKey,
      settings: settingsHook.settings,
      userPreferences: preferencesHook.userPreferences,
      modelGroups: modelGroupsHook.modelGroups
    }
    saveToStorage(dataToSave)
    appStateHook.updateLastSaved()
  }, [
    modelGroupsHook.selectedModelGroupKey,
    templateSelectionHook.selectedTemplateKey,
    settingsHook.settings,
    preferencesHook.userPreferences,
    modelGroupsHook.modelGroups
  ])

  // Enhanced actions that coordinate between hooks
  const setSelectedModelGroup = useCallback((key: string | null) => {
    modelGroupsHook.setSelectedModelGroup(key)
    // Reset template when changing model group
    if (key !== modelGroupsHook.selectedModelGroupKey) {
      templateSelectionHook.clearSelectedTemplate()
    }
  }, [modelGroupsHook, templateSelectionHook])

  const setSelectedTemplate = useCallback((key: string | null) => {
    templateSelectionHook.setSelectedTemplate(key)
  }, [templateSelectionHook])

  const exportConfig = useCallback((): string => {
    const configToExport = {
      selectedModelGroupKey: modelGroupsHook.selectedModelGroupKey,
      selectedTemplateKey: templateSelectionHook.selectedTemplateKey,
      settings: settingsHook.settings,
      userPreferences: preferencesHook.userPreferences,
      modelGroups: modelGroupsHook.modelGroups,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }
    return JSON.stringify(configToExport, null, 2)
  }, [modelGroupsHook, templateSelectionHook, settingsHook, preferencesHook])

  const importConfig = useCallback((configJson: string) => {
    try {
      const parsed = JSON.parse(configJson)
      
      // Import settings
      if (parsed.settings) {
        settingsHook.updateSettings(parsed.settings)
      }
      
      // Import user preferences
      if (parsed.userPreferences) {
        preferencesHook.updateUserPreferences(parsed.userPreferences)
      }
      
      // Import model groups
      if (parsed.modelGroups) {
        modelGroupsHook.setAllModelGroups({ ...defaultModelGroups, ...parsed.modelGroups })
      }
      
      // Import selections
      if (parsed.selectedModelGroupKey !== undefined) {
        modelGroupsHook.setSelectedModelGroup(parsed.selectedModelGroupKey)
      }
      
      if (parsed.selectedTemplateKey !== undefined) {
        templateSelectionHook.setSelectedTemplate(parsed.selectedTemplateKey)
      }
      
      appStateHook.clearError()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid JSON format'
      appStateHook.setError(`Failed to import config: ${errorMessage}`)
    }
  }, [modelGroupsHook, templateSelectionHook, settingsHook, preferencesHook, appStateHook])

  const resetAllConfig = useCallback(() => {
    modelGroupsHook.resetModelGroups()
    settingsHook.resetSettings()
    preferencesHook.resetUserPreferences()
    templateSelectionHook.clearSelectedTemplate()
    appStateHook.resetState()
  }, [modelGroupsHook, settingsHook, preferencesHook, templateSelectionHook, appStateHook])

  const actions: AppConfigContextActions = {
    setSelectedModelGroup,
    setSelectedTemplate,
    updateModelGroup: modelGroupsHook.updateModelGroup,
    addModelGroup: modelGroupsHook.addModelGroup,
    removeModelGroup: modelGroupsHook.removeModelGroup,
    toggleModelGroupEnabled: modelGroupsHook.toggleModelGroupEnabled,
    getEnabledModelGroups: modelGroupsHook.getEnabledModelGroups,
    getModelGroupByKey: modelGroupsHook.getModelGroupByKey,
    getTemplateByKey: modelGroupsHook.getTemplateByKey,
    updateSettings: settingsHook.updateSettings,
    resetSettings: settingsHook.resetSettings,
    updateUserPreferences: preferencesHook.updateUserPreferences,
    resetUserPreferences: preferencesHook.resetUserPreferences,
    setLoading: appStateHook.setLoading,
    setError: appStateHook.setError,
    clearError: appStateHook.clearError,
    exportConfig,
    importConfig,
    resetAllConfig
  }

  const state: AppConfigContextState = {
    modelGroups: modelGroupsHook.modelGroups,
    selectedModelGroupKey: modelGroupsHook.selectedModelGroupKey,
    selectedTemplateKey: templateSelectionHook.selectedTemplateKey,
    settings: settingsHook.settings,
    userPreferences: preferencesHook.userPreferences,
    isLoading: appStateHook.isLoading,
    error: appStateHook.error,
    lastSaved: appStateHook.lastSaved
  }

  const value: AppConfigContextValue = {
    state,
    actions
  }

  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  )
}

// Custom Hook
export const useAppConfig = (): AppConfigContextValue => {
  const context = useContext(AppConfigContext)
  if (context === undefined) {
    throw new Error('useAppConfig must be used within an AppConfigProvider')
  }
  return context
}

export default AppConfigProvider