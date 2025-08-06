import { useState } from 'react'

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto'
  language: string
  timezone: string
  autoSave: boolean
  debugMode: boolean
  apiTimeout: number
  maxRetries: number
}

const defaultSettings: AppSettings = {
  theme: 'auto',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  autoSave: true,
  debugMode: false,
  apiTimeout: 30000,
  maxRetries: 3
}

export const useAppSettings = (initialSettings: AppSettings = defaultSettings) => {
  const [settings, setSettings] = useState<AppSettings>(initialSettings)

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...updates
    }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  const updateTheme = (theme: AppSettings['theme']) => {
    updateSettings({ theme })
  }

  const updateLanguage = (language: string) => {
    updateSettings({ language })
  }

  const updateTimezone = (timezone: string) => {
    updateSettings({ timezone })
  }

  const toggleAutoSave = () => {
    setSettings(prev => ({
      ...prev,
      autoSave: !prev.autoSave
    }))
  }

  const toggleDebugMode = () => {
    setSettings(prev => ({
      ...prev,
      debugMode: !prev.debugMode
    }))
  }

  const updateApiTimeout = (apiTimeout: number) => {
    updateSettings({ apiTimeout })
  }

  const updateMaxRetries = (maxRetries: number) => {
    updateSettings({ maxRetries })
  }

  const setAllSettings = (newSettings: AppSettings) => {
    setSettings(newSettings)
  }

  return {
    settings,
    updateSettings,
    resetSettings,
    updateTheme,
    updateLanguage,
    updateTimezone,
    toggleAutoSave,
    toggleDebugMode,
    updateApiTimeout,
    updateMaxRetries,
    setAllSettings
  }
}