import { describe, it, expect, vi } from 'vitest'
import { getBackendSiteTypeForModelGroup } from '../modelGroupKeyToBackendSiteType'

// Mock modelGroups
vi.mock('../../modelGroups', () => ({
  modelGroups: {
    'medical': {
      models: ['gpt-4', 'claude'],
      title: 'Medical Practice',
      backend_site_type: 'medical',
      image: 'medical.jpg',
      adjectives: ['professional', 'trustworthy'],
      templates: []
    },
    'restaurant': {
      models: ['gpt-3.5', 'claude'],
      title: 'Restaurant',
      backend_site_type: 'restaurant',
      image: 'restaurant.jpg',
      adjectives: ['welcoming', 'delicious'],
      templates: []
    },
    'legal': {
      models: ['gpt-4'],
      title: 'Legal Firm',
      backend_site_type: 'legal',
      image: 'legal.jpg',
      adjectives: ['authoritative', 'professional'],
      templates: []
    },
    'withoutBackendType': {
      models: ['gpt-4'],
      title: 'No Backend Type',
      image: 'default.jpg',
      adjectives: ['generic'],
      templates: []
      // Intentionally missing backend_site_type
    }
  }
}))

describe('getBackendSiteTypeForModelGroup', () => {
  it('should return backend_site_type for valid model group key', () => {
    const result = getBackendSiteTypeForModelGroup('medical')
    expect(result).toBe('medical')
  })

  it('should return backend_site_type for different model group', () => {
    const result = getBackendSiteTypeForModelGroup('restaurant')
    expect(result).toBe('restaurant')
  })

  it('should return backend_site_type for legal model group', () => {
    const result = getBackendSiteTypeForModelGroup('legal')
    expect(result).toBe('legal')
  })

  it('should return undefined for invalid model group key', () => {
    const result = getBackendSiteTypeForModelGroup('nonexistent')
    expect(result).toBeUndefined()
  })

  it('should return undefined for empty string key', () => {
    const result = getBackendSiteTypeForModelGroup('')
    expect(result).toBeUndefined()
  })

  it('should return undefined for model group without backend_site_type', () => {
    const result = getBackendSiteTypeForModelGroup('withoutBackendType')
    expect(result).toBeUndefined()
  })

  it('should handle null input gracefully', () => {
    const result = getBackendSiteTypeForModelGroup(null as any)
    expect(result).toBeUndefined()
  })

  it('should handle undefined input gracefully', () => {
    const result = getBackendSiteTypeForModelGroup(undefined as any)
    expect(result).toBeUndefined()
  })

  it('should be case sensitive', () => {
    const result = getBackendSiteTypeForModelGroup('MEDICAL')
    expect(result).toBeUndefined()
  })

  it('should handle special characters in key gracefully', () => {
    const result = getBackendSiteTypeForModelGroup('medical-special!')
    expect(result).toBeUndefined()
  })
})