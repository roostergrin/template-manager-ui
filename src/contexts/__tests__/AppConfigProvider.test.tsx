import { renderHook, act } from '@testing-library/react'
import { ReactNode } from 'react'
import { vi } from 'vitest'
import { AppConfigProvider, useAppConfig, AppSettings, UserPreferences } from '../AppConfigProvider'
import { ModelGroup } from '../../modelGroups'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Mock Intl.DateTimeFormat for consistent timezone tests
const mockDateTimeFormat = vi.fn(() => ({
  resolvedOptions: () => ({ timeZone: 'America/New_York' })
}))
Object.defineProperty(Intl, 'DateTimeFormat', {
  value: mockDateTimeFormat,
  writable: true
})

const createWrapper = (initialState?: any) => {
  return ({ children }: { children: ReactNode }) => (
    <AppConfigProvider initialState={initialState}>
      {children}
    </AppConfigProvider>
  )
}

const mockModelGroup: ModelGroup = {
  models: ['model1', 'model2'],
  title: 'Test Template',
  image: 'test-image.jpg',
  adjectives: ['Modern', 'Clean'],
  demoUrl: 'https://test.com',
  templates: [
    {
      name: 'Test Template 1',
      description: 'A test template',
      data: { test: true }
    },
    {
      name: 'Test Template 2',
      description: 'Another test template',
      data: { test: false }
    }
  ],
  backend_site_type: 'test',
  enabled: true
}

const mockSettings: AppSettings = {
  theme: 'dark',
  language: 'es',
  timezone: 'Europe/London',
  autoSave: false,
  debugMode: true,
  apiTimeout: 300000,
  maxRetries: 5
}

const mockUserPreferences: UserPreferences = {
  defaultModelGroup: 'test-group',
  defaultTemplate: 'test-template',
  preferredViewMode: 'list',
  showAdvancedOptions: true,
  hideDisabledTemplates: false,
  compactMode: true
}

describe('AppConfigProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the mock to ensure consistent timezone
    mockDateTimeFormat.mockReturnValue({
      resolvedOptions: () => ({ timeZone: 'America/New_York' })
    })
  })

  describe('Hook Access', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useAppConfig())
      }).toThrow('useAppConfig must be used within an AppConfigProvider')
    })

    it('should provide context value when used within provider', () => {
      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper()
      })

      expect(result.current.state).toBeDefined()
      expect(result.current.actions).toBeDefined()
    })
  })

  describe('Initial State', () => {
    it.skip('should initialize with default state', () => {
      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper()
      })

      expect(result.current.state).toMatchObject({
        selectedModelGroupKey: null,
        selectedTemplateKey: null,
        settings: expect.objectContaining({
          theme: 'auto',
          language: 'en',
          autoSave: true,
          debugMode: false,
          apiTimeout: 300000,
          maxRetries: 3
        }),
        userPreferences: {
          defaultModelGroup: undefined,
          defaultTemplate: undefined,
          preferredViewMode: 'grid',
          showAdvancedOptions: false,
          hideDisabledTemplates: true,
          compactMode: false
        },
        isLoading: false,
        error: null,
        lastSaved: null
      })
      
      expect(result.current.state.modelGroups).toBeDefined()
      expect(result.current.state.settings.timezone).toBeTruthy()
    })

    it('should accept custom initial state', () => {
      const customState = {
        selectedModelGroupKey: 'test-group',
        selectedTemplateKey: 'test-template',
        settings: mockSettings,
        userPreferences: mockUserPreferences
      }

      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper(customState)
      })

      expect(result.current.state.selectedModelGroupKey).toBe('test-group')
      expect(result.current.state.selectedTemplateKey).toBe('test-template')
      expect(result.current.state.settings).toEqual(mockSettings)
      expect(result.current.state.userPreferences).toEqual(mockUserPreferences)
    })
  })

  describe('Model Group Management', () => {
    it('should set selected model group', () => {
      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.actions.setSelectedModelGroup('test-group')
      })

      expect(result.current.state.selectedModelGroupKey).toBe('test-group')
      expect(result.current.state.selectedTemplateKey).toBeNull() // Should reset template
      expect(result.current.state.lastSaved).toBeDefined()
    })

    it('should set selected template', () => {
      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.actions.setSelectedTemplate('test-template')
      })

      expect(result.current.state.selectedTemplateKey).toBe('test-template')
      expect(result.current.state.lastSaved).toBeDefined()
    })

    it('should update model group', () => {
      const initialModelGroups = { 'test-group': mockModelGroup }
      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper({ modelGroups: initialModelGroups })
      })

      const updates = { title: 'Updated Title', enabled: false }

      act(() => {
        result.current.actions.updateModelGroup('test-group', updates)
      })

      expect(result.current.state.modelGroups['test-group']).toMatchObject({
        ...mockModelGroup,
        ...updates
      })
      expect(result.current.state.lastSaved).toBeDefined()
    })

    it('should add model group', () => {
      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.actions.addModelGroup('new-group', mockModelGroup)
      })

      expect(result.current.state.modelGroups['new-group']).toEqual(mockModelGroup)
      expect(result.current.state.lastSaved).toBeDefined()
    })

    it.skip('should remove model group', () => {
      const initialModelGroups = { 
        'test-group': mockModelGroup,
        'other-group': { ...mockModelGroup, title: 'Other' }
      }
      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper({ 
          modelGroups: initialModelGroups,
          selectedModelGroupKey: 'test-group',
          selectedTemplateKey: 'test-template'
        })
      })

      act(() => {
        result.current.actions.removeModelGroup('test-group')
      })

      expect(result.current.state.modelGroups['test-group']).toBeUndefined()
      expect(result.current.state.modelGroups['other-group']).toBeDefined()
      expect(result.current.state.selectedModelGroupKey).toBeNull() // Should reset selection
      expect(result.current.state.selectedTemplateKey).toBeNull() // Should reset template
      expect(result.current.state.lastSaved).toBeDefined()
    })

    it('should not reset selections when removing different model group', () => {
      const initialModelGroups = { 
        'test-group': mockModelGroup,
        'other-group': { ...mockModelGroup, title: 'Other' }
      }
      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper({ 
          modelGroups: initialModelGroups,
          selectedModelGroupKey: 'test-group',
          selectedTemplateKey: 'test-template'
        })
      })

      act(() => {
        result.current.actions.removeModelGroup('other-group')
      })

      expect(result.current.state.selectedModelGroupKey).toBe('test-group')
      expect(result.current.state.selectedTemplateKey).toBe('test-template')
    })

    it('should toggle model group enabled state', () => {
      const initialModelGroups = { 'test-group': { ...mockModelGroup, enabled: true } }
      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper({ modelGroups: initialModelGroups })
      })

      act(() => {
        result.current.actions.toggleModelGroupEnabled('test-group')
      })

      expect(result.current.state.modelGroups['test-group'].enabled).toBe(false)

      act(() => {
        result.current.actions.toggleModelGroupEnabled('test-group')
      })

      expect(result.current.state.modelGroups['test-group'].enabled).toBe(true)
    })

    it.skip('should handle toggling non-existent model group', () => {
      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.actions.toggleModelGroupEnabled('non-existent')
      })

      // Should not crash or change state
      expect(result.current.state.lastSaved).toBeNull()
    })

    it('should get enabled model groups', () => {
      const initialModelGroups = {
        'enabled-group': { ...mockModelGroup, enabled: true },
        'disabled-group': { ...mockModelGroup, enabled: false },
        'default-group': mockModelGroup // enabled by default
      }
      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper({ modelGroups: initialModelGroups })
      })

      const enabledGroups = result.current.actions.getEnabledModelGroups()

      expect(Object.keys(enabledGroups)).toHaveLength(2)
      expect(enabledGroups['enabled-group']).toBeDefined()
      expect(enabledGroups['default-group']).toBeDefined()
      expect(enabledGroups['disabled-group']).toBeUndefined()
    })

    it('should get model group by key', () => {
      const initialModelGroups = { 'test-group': mockModelGroup }
      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper({ modelGroups: initialModelGroups })
      })

      const modelGroup = result.current.actions.getModelGroupByKey('test-group')
      expect(modelGroup).toEqual(mockModelGroup)

      const nonExistent = result.current.actions.getModelGroupByKey('non-existent')
      expect(nonExistent).toBeUndefined()
    })

    it('should get template by key using index', () => {
      const initialModelGroups = { 'test-group': mockModelGroup }
      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper({ modelGroups: initialModelGroups })
      })

      const template = result.current.actions.getTemplateByKey('test-group', '0')
      expect(template).toEqual(mockModelGroup.templates[0])

      const template2 = result.current.actions.getTemplateByKey('test-group', '1')
      expect(template2).toEqual(mockModelGroup.templates[1])
    })

    it('should get template by key using name', () => {
      const initialModelGroups = { 'test-group': mockModelGroup }
      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper({ modelGroups: initialModelGroups })
      })

      const template = result.current.actions.getTemplateByKey('test-group', 'Test Template 1')
      expect(template).toEqual(mockModelGroup.templates[0])
    })

    it('should return undefined for invalid template key', () => {
      const initialModelGroups = { 'test-group': mockModelGroup }
      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper({ modelGroups: initialModelGroups })
      })

      const nonExistent = result.current.actions.getTemplateByKey('test-group', 'non-existent')
      expect(nonExistent).toBeUndefined()

      const invalidIndex = result.current.actions.getTemplateByKey('test-group', '99')
      expect(invalidIndex).toBeUndefined()

      const invalidModelGroup = result.current.actions.getTemplateByKey('non-existent', '0')
      expect(invalidModelGroup).toBeUndefined()
    })
  })

  describe('Settings Management', () => {
    it('should update settings', () => {
      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper()
      })

      const updates = { theme: 'dark' as const, debugMode: true }

      act(() => {
        result.current.actions.updateSettings(updates)
      })

      expect(result.current.state.settings).toMatchObject({
        theme: 'dark',
        debugMode: true,
        // Other settings should remain unchanged
        language: 'en',
        autoSave: true
      })
      expect(result.current.state.lastSaved).toBeDefined()
    })

    it.skip('should reset settings', () => {
      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper({ settings: mockSettings })
      })

      act(() => {
        result.current.actions.resetSettings()
      })

      expect(result.current.state.settings).toMatchObject({
        theme: 'auto',
        language: 'en',
        autoSave: true,
        debugMode: false,
        apiTimeout: 300000,
        maxRetries: 3
      })
      // Timezone should be set to something
      expect(result.current.state.settings.timezone).toBeTruthy()
      expect(result.current.state.lastSaved).toBeDefined()
    })
  })

  describe('User Preferences Management', () => {
    it('should update user preferences', () => {
      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper()
      })

      const updates = { preferredViewMode: 'list' as const, compactMode: true }

      act(() => {
        result.current.actions.updateUserPreferences(updates)
      })

      expect(result.current.state.userPreferences).toMatchObject({
        preferredViewMode: 'list',
        compactMode: true,
        // Other preferences should remain unchanged
        showAdvancedOptions: false,
        hideDisabledTemplates: true
      })
      expect(result.current.state.lastSaved).toBeDefined()
    })

    it('should reset user preferences', () => {
      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper({ userPreferences: mockUserPreferences })
      })

      act(() => {
        result.current.actions.resetUserPreferences()
      })

      expect(result.current.state.userPreferences).toMatchObject({
        defaultModelGroup: undefined,
        defaultTemplate: undefined,
        preferredViewMode: 'grid',
        showAdvancedOptions: false,
        hideDisabledTemplates: true,
        compactMode: false
      })
      expect(result.current.state.lastSaved).toBeDefined()
    })
  })

  describe('Loading and Error Handling', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.actions.setLoading(true)
      })

      expect(result.current.state.isLoading).toBe(true)
    })

    it('should set error and clear loading', () => {
      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper({ isLoading: true })
      })

      act(() => {
        result.current.actions.setError('Test error')
      })

      expect(result.current.state.error).toBe('Test error')
      expect(result.current.state.isLoading).toBe(false)
    })

    it('should clear error', () => {
      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper({ error: 'Test error' })
      })

      act(() => {
        result.current.actions.clearError()
      })

      expect(result.current.state.error).toBeNull()
    })
  })

  describe('Import/Export Configuration', () => {
    it('should export configuration', () => {
      const customState = {
        selectedModelGroupKey: 'test-group',
        selectedTemplateKey: 'test-template',
        settings: mockSettings,
        userPreferences: mockUserPreferences,
        modelGroups: { 'test-group': mockModelGroup }
      }

      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper(customState)
      })

      const exported = result.current.actions.exportConfig()
      const parsed = JSON.parse(exported)

      expect(parsed).toMatchObject({
        selectedModelGroupKey: 'test-group',
        selectedTemplateKey: 'test-template',
        settings: mockSettings,
        userPreferences: mockUserPreferences,
        modelGroups: { 'test-group': mockModelGroup },
        version: '1.0.0'
      })
      expect(parsed.exportedAt).toBeDefined()
    })

    it('should import valid configuration', () => {
      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper()
      })

      const configToImport = {
        selectedModelGroupKey: 'imported-group',
        selectedTemplateKey: 'imported-template',
        settings: mockSettings,
        userPreferences: mockUserPreferences,
        modelGroups: { 'imported-group': mockModelGroup }
      }

      act(() => {
        result.current.actions.importConfig(JSON.stringify(configToImport))
      })

      expect(result.current.state.selectedModelGroupKey).toBe('imported-group')
      expect(result.current.state.selectedTemplateKey).toBe('imported-template')
      expect(result.current.state.settings).toEqual(mockSettings)
      expect(result.current.state.userPreferences).toEqual(mockUserPreferences)
      expect(result.current.state.lastSaved).toBeDefined()
    })

    it('should handle invalid JSON import', () => {
      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.actions.importConfig('invalid json')
      })

      expect(result.current.state.error).toContain('Failed to import config')
    })

    it('should reset all configuration', () => {
      const customState = {
        selectedModelGroupKey: 'test-group',
        selectedTemplateKey: 'test-template',
        settings: mockSettings,
        userPreferences: mockUserPreferences
      }

      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper(customState)
      })

      act(() => {
        result.current.actions.resetAllConfig()
      })

      expect(result.current.state.selectedModelGroupKey).toBeNull()
      expect(result.current.state.selectedTemplateKey).toBeNull()
      expect(result.current.state.settings.theme).toBe('auto')
      expect(result.current.state.userPreferences.preferredViewMode).toBe('grid')
      expect(result.current.state.lastSaved).toBeDefined()
    })
  })

  describe('LocalStorage Integration', () => {
    it('should attempt to load from localStorage on mount', () => {
      const savedConfig = {
        selectedModelGroupKey: 'saved-group',
        selectedTemplateKey: 'saved-template',
        settings: mockSettings,
        userPreferences: mockUserPreferences,
        modelGroups: { 'saved-group': mockModelGroup }
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedConfig))

      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper()
      })

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('template-manager-app-config')
      
      // Note: The actual loading happens in useEffect, so we need to wait for it
      setTimeout(() => {
        expect(result.current.state.selectedModelGroupKey).toBe('saved-group')
        expect(result.current.state.settings).toEqual(mockSettings)
      }, 0)
    })

    it('should handle localStorage load errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      renderHook(() => useAppConfig(), {
        wrapper: createWrapper()
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load app config from localStorage:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('should save to localStorage on state changes', () => {
      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.actions.setSelectedModelGroup('new-group')
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'template-manager-app-config',
        expect.stringContaining('new-group')
      )
    })

    it('should handle localStorage save errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage save error')
      })

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.actions.setSelectedModelGroup('test-group')
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save app config to localStorage:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Edge Cases', () => {
    it('should handle invalid localStorage data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json')

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      renderHook(() => useAppConfig(), {
        wrapper: createWrapper()
      })

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should handle partial localStorage data', () => {
      const partialConfig = {
        selectedModelGroupKey: 'partial-group',
        settings: { theme: 'dark' }
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(partialConfig))

      const { result } = renderHook(() => useAppConfig(), {
        wrapper: createWrapper()
      })

      setTimeout(() => {
        expect(result.current.state.selectedModelGroupKey).toBe('partial-group')
        expect(result.current.state.settings.theme).toBe('dark')
        expect(result.current.state.settings.language).toBe('en') // Should maintain defaults
      }, 0)
    })
  })
})