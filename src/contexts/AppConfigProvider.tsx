import React, { createContext, useContext, useReducer, useCallback, ReactNode, useEffect } from 'react'
import { ModelGroup, TemplateInfo, modelGroups as defaultModelGroups } from '../modelGroups'

// Application settings types
export interface AppSettings {
  theme: 'light' | 'dark' | 'auto'
  language: string
  timezone: string
  autoSave: boolean
  debugMode: boolean
  apiTimeout: number
  maxRetries: number
}

export interface UserPreferences {
  defaultModelGroup?: string
  defaultTemplate?: string
  preferredViewMode: 'grid' | 'list'
  showAdvancedOptions: boolean
  hideDisabledTemplates: boolean
  compactMode: boolean
}

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

// Action Types
type AppConfigAction =
  | { type: 'SET_SELECTED_MODEL_GROUP'; payload: string | null }
  | { type: 'SET_SELECTED_TEMPLATE'; payload: string | null }
  | { type: 'UPDATE_MODEL_GROUP'; payload: { key: string; updates: Partial<ModelGroup> } }
  | { type: 'ADD_MODEL_GROUP'; payload: { key: string; modelGroup: ModelGroup } }
  | { type: 'REMOVE_MODEL_GROUP'; payload: string }
  | { type: 'TOGGLE_MODEL_GROUP_ENABLED'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'RESET_SETTINGS' }
  | { type: 'UPDATE_USER_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'RESET_USER_PREFERENCES' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'IMPORT_CONFIG'; payload: Partial<AppConfigContextState> }
  | { type: 'RESET_ALL_CONFIG' }
  | { type: 'LOAD_FROM_STORAGE'; payload: Partial<AppConfigContextState> }

// Constants
const STORAGE_KEY = 'template-manager-app-config'

const defaultSettings: AppSettings = {
  theme: 'auto',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  autoSave: true,
  debugMode: false,
  apiTimeout: 30000,
  maxRetries: 3
}

const defaultUserPreferences: UserPreferences = {
  defaultModelGroup: undefined,
  defaultTemplate: undefined,
  preferredViewMode: 'grid',
  showAdvancedOptions: false,
  hideDisabledTemplates: true,
  compactMode: false
}

// Initial State
const initialState: AppConfigContextState = {
  modelGroups: defaultModelGroups,
  selectedModelGroupKey: null,
  selectedTemplateKey: null,
  settings: defaultSettings,
  userPreferences: defaultUserPreferences,
  isLoading: false,
  error: null,
  lastSaved: null
}

// Helper Functions
const getEnabledModelGroups = (modelGroups: Record<string, ModelGroup>): Record<string, ModelGroup> => {
  return Object.fromEntries(
    Object.entries(modelGroups).filter(([_, group]) => group.enabled !== false)
  )
}

const getModelGroupByKey = (modelGroups: Record<string, ModelGroup>, key: string): ModelGroup | undefined => {
  return modelGroups[key]
}

const getTemplateByKey = (
  modelGroups: Record<string, ModelGroup>,
  modelGroupKey: string,
  templateKey: string
): TemplateInfo | undefined => {
  const modelGroup = modelGroups[modelGroupKey]
  if (!modelGroup) return undefined
  
  const templateIndex = parseInt(templateKey, 10)
  if (isNaN(templateIndex) || templateIndex < 0 || templateIndex >= modelGroup.templates.length) {
    return modelGroup.templates.find(template => template.name === templateKey)
  }
  
  return modelGroup.templates[templateIndex]
}

// Load from localStorage
const loadFromStorage = (): Partial<AppConfigContextState> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        selectedModelGroupKey: parsed.selectedModelGroupKey,
        selectedTemplateKey: parsed.selectedTemplateKey,
        settings: { ...defaultSettings, ...parsed.settings },
        userPreferences: { ...defaultUserPreferences, ...parsed.userPreferences },
        modelGroups: { ...defaultModelGroups, ...parsed.modelGroups }
      }
    }
  } catch (error) {
    console.warn('Failed to load app config from localStorage:', error)
  }
  return {}
}

// Save to localStorage
const saveToStorage = (state: AppConfigContextState) => {
  try {
    const toSave = {
      selectedModelGroupKey: state.selectedModelGroupKey,
      selectedTemplateKey: state.selectedTemplateKey,
      settings: state.settings,
      userPreferences: state.userPreferences,
      modelGroups: state.modelGroups
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch (error) {
    console.warn('Failed to save app config to localStorage:', error)
  }
}

// Reducer
const appConfigReducer = (
  state: AppConfigContextState,
  action: AppConfigAction
): AppConfigContextState => {
  switch (action.type) {
    case 'SET_SELECTED_MODEL_GROUP':
      return {
        ...state,
        selectedModelGroupKey: action.payload,
        selectedTemplateKey: null, // Reset template when changing model group
        lastSaved: new Date().toISOString()
      }
    
    case 'SET_SELECTED_TEMPLATE':
      return {
        ...state,
        selectedTemplateKey: action.payload,
        lastSaved: new Date().toISOString()
      }
    
    case 'UPDATE_MODEL_GROUP':
      return {
        ...state,
        modelGroups: {
          ...state.modelGroups,
          [action.payload.key]: {
            ...state.modelGroups[action.payload.key],
            ...action.payload.updates
          }
        },
        lastSaved: new Date().toISOString()
      }
    
    case 'ADD_MODEL_GROUP':
      return {
        ...state,
        modelGroups: {
          ...state.modelGroups,
          [action.payload.key]: action.payload.modelGroup
        },
        lastSaved: new Date().toISOString()
      }
    
    case 'REMOVE_MODEL_GROUP':
      const newModelGroups = { ...state.modelGroups }
      delete newModelGroups[action.payload]
      
      return {
        ...state,
        modelGroups: newModelGroups,
        selectedModelGroupKey: state.selectedModelGroupKey === action.payload 
          ? null 
          : state.selectedModelGroupKey,
        selectedTemplateKey: state.selectedModelGroupKey === action.payload 
          ? null 
          : state.selectedTemplateKey,
        lastSaved: new Date().toISOString()
      }
    
    case 'TOGGLE_MODEL_GROUP_ENABLED':
      const modelGroup = state.modelGroups[action.payload]
      if (!modelGroup) return state
      
      return {
        ...state,
        modelGroups: {
          ...state.modelGroups,
          [action.payload]: {
            ...modelGroup,
            enabled: !(modelGroup.enabled ?? true)
          }
        },
        lastSaved: new Date().toISOString()
      }
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        },
        lastSaved: new Date().toISOString()
      }
    
    case 'RESET_SETTINGS':
      return {
        ...state,
        settings: defaultSettings,
        lastSaved: new Date().toISOString()
      }
    
    case 'UPDATE_USER_PREFERENCES':
      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          ...action.payload
        },
        lastSaved: new Date().toISOString()
      }
    
    case 'RESET_USER_PREFERENCES':
      return {
        ...state,
        userPreferences: defaultUserPreferences,
        lastSaved: new Date().toISOString()
      }
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      }
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    
    case 'IMPORT_CONFIG':
      return {
        ...state,
        ...action.payload,
        lastSaved: new Date().toISOString()
      }
    
    case 'RESET_ALL_CONFIG':
      return {
        ...initialState,
        lastSaved: new Date().toISOString()
      }
    
    case 'LOAD_FROM_STORAGE':
      return {
        ...state,
        ...action.payload
      }
    
    default:
      return state
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
  const [state, dispatch] = useReducer(
    appConfigReducer,
    { ...initialState, ...providedInitialState }
  )

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = loadFromStorage()
    if (Object.keys(savedData).length > 0) {
      dispatch({ type: 'LOAD_FROM_STORAGE', payload: savedData })
    }
  }, [])

  // Save to localStorage on state changes
  useEffect(() => {
    saveToStorage(state)
  }, [state.selectedModelGroupKey, state.selectedTemplateKey, state.settings, state.userPreferences, state.modelGroups])

  // Action Creators - Model Group Management
  const setSelectedModelGroup = useCallback((key: string | null) => {
    dispatch({ type: 'SET_SELECTED_MODEL_GROUP', payload: key })
  }, [])

  const setSelectedTemplate = useCallback((key: string | null) => {
    dispatch({ type: 'SET_SELECTED_TEMPLATE', payload: key })
  }, [])

  const updateModelGroup = useCallback((key: string, updates: Partial<ModelGroup>) => {
    dispatch({ type: 'UPDATE_MODEL_GROUP', payload: { key, updates } })
  }, [])

  const addModelGroup = useCallback((key: string, modelGroup: ModelGroup) => {
    dispatch({ type: 'ADD_MODEL_GROUP', payload: { key, modelGroup } })
  }, [])

  const removeModelGroup = useCallback((key: string) => {
    dispatch({ type: 'REMOVE_MODEL_GROUP', payload: key })
  }, [])

  const toggleModelGroupEnabled = useCallback((key: string) => {
    dispatch({ type: 'TOGGLE_MODEL_GROUP_ENABLED', payload: key })
  }, [])

  const getEnabledModelGroupsCallback = useCallback((): Record<string, ModelGroup> => {
    return getEnabledModelGroups(state.modelGroups)
  }, [state.modelGroups])

  const getModelGroupByKeyCallback = useCallback((key: string): ModelGroup | undefined => {
    return getModelGroupByKey(state.modelGroups, key)
  }, [state.modelGroups])

  const getTemplateByKeyCallback = useCallback((modelGroupKey: string, templateKey: string): TemplateInfo | undefined => {
    return getTemplateByKey(state.modelGroups, modelGroupKey, templateKey)
  }, [state.modelGroups])

  // Action Creators - Settings Management
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: updates })
  }, [])

  const resetSettings = useCallback(() => {
    dispatch({ type: 'RESET_SETTINGS' })
  }, [])

  // Action Creators - User Preferences Management
  const updateUserPreferences = useCallback((updates: Partial<UserPreferences>) => {
    dispatch({ type: 'UPDATE_USER_PREFERENCES', payload: updates })
  }, [])

  const resetUserPreferences = useCallback(() => {
    dispatch({ type: 'RESET_USER_PREFERENCES' })
  }, [])

  // Action Creators - Utility Actions
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }, [])

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }, [])

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  const exportConfig = useCallback((): string => {
    const configToExport = {
      selectedModelGroupKey: state.selectedModelGroupKey,
      selectedTemplateKey: state.selectedTemplateKey,
      settings: state.settings,
      userPreferences: state.userPreferences,
      modelGroups: state.modelGroups,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }
    return JSON.stringify(configToExport, null, 2)
  }, [state])

  const importConfig = useCallback((configJson: string) => {
    try {
      const parsed = JSON.parse(configJson)
      const importData: Partial<AppConfigContextState> = {
        selectedModelGroupKey: parsed.selectedModelGroupKey,
        selectedTemplateKey: parsed.selectedTemplateKey,
        settings: { ...defaultSettings, ...parsed.settings },
        userPreferences: { ...defaultUserPreferences, ...parsed.userPreferences },
        modelGroups: { ...defaultModelGroups, ...parsed.modelGroups }
      }
      dispatch({ type: 'IMPORT_CONFIG', payload: importData })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid JSON format'
      dispatch({ type: 'SET_ERROR', payload: `Failed to import config: ${errorMessage}` })
    }
  }, [])

  const resetAllConfig = useCallback(() => {
    dispatch({ type: 'RESET_ALL_CONFIG' })
  }, [])

  const actions: AppConfigContextActions = {
    setSelectedModelGroup,
    setSelectedTemplate,
    updateModelGroup,
    addModelGroup,
    removeModelGroup,
    toggleModelGroupEnabled,
    getEnabledModelGroups: getEnabledModelGroupsCallback,
    getModelGroupByKey: getModelGroupByKeyCallback,
    getTemplateByKey: getTemplateByKeyCallback,
    updateSettings,
    resetSettings,
    updateUserPreferences,
    resetUserPreferences,
    setLoading,
    setError,
    clearError,
    exportConfig,
    importConfig,
    resetAllConfig
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