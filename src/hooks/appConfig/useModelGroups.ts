import { useState, useCallback } from 'react'
import { ModelGroup, TemplateInfo, modelGroups as defaultModelGroups } from '../../modelGroups'

export const useModelGroups = (initialModelGroups: Record<string, ModelGroup> = defaultModelGroups) => {
  const [modelGroups, setModelGroups] = useState<Record<string, ModelGroup>>(initialModelGroups)
  const [selectedModelGroupKey, setSelectedModelGroupKey] = useState<string | null>(null)

  // Simple state setters - no useCallback needed
  const updateModelGroup = (key: string, updates: Partial<ModelGroup>) => {
    setModelGroups(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...updates
      }
    }))
  }

  const addModelGroup = (key: string, modelGroup: ModelGroup) => {
    setModelGroups(prev => ({
      ...prev,
      [key]: modelGroup
    }))
  }

  const removeModelGroup = (key: string) => {
    setModelGroups(prev => {
      const newModelGroups = { ...prev }
      delete newModelGroups[key]
      return newModelGroups
    })
    
    // Clear selection if removed model group was selected
    setSelectedModelGroupKey(prev => prev === key ? null : prev)
  }

  const toggleModelGroupEnabled = (key: string) => {
    setModelGroups(prev => {
      const modelGroup = prev[key]
      if (!modelGroup) return prev
      
      return {
        ...prev,
        [key]: {
          ...modelGroup,
          enabled: !(modelGroup.enabled ?? true)
        }
      }
    })
  }

  const getEnabledModelGroups = useCallback((): Record<string, ModelGroup> => {
    return Object.fromEntries(
      Object.entries(modelGroups).filter(([_, group]) => group.enabled !== false)
    )
  }, [modelGroups])

  const getModelGroupByKey = useCallback((key: string): ModelGroup | undefined => {
    return modelGroups[key]
  }, [modelGroups])

  const getTemplateByKey = useCallback((
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
  }, [modelGroups])

  const setSelectedModelGroup = (key: string | null) => {
    setSelectedModelGroupKey(key)
  }

  const resetModelGroups = () => {
    setModelGroups(defaultModelGroups)
    setSelectedModelGroupKey(null)
  }

  const setAllModelGroups = (newModelGroups: Record<string, ModelGroup>) => {
    setModelGroups(newModelGroups)
  }

  return {
    modelGroups,
    selectedModelGroupKey,
    updateModelGroup,
    addModelGroup,
    removeModelGroup,
    toggleModelGroupEnabled,
    getEnabledModelGroups,
    getModelGroupByKey,
    getTemplateByKey,
    setSelectedModelGroup,
    resetModelGroups,
    setAllModelGroups
  }
}