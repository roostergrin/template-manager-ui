import { describe, it, expect, vi, beforeEach } from 'vitest'
import generateSitemapService from '../generateSitemapService'
import apiClient from '../apiService'
import { GenerateSitemapRequest, GenerateSitemapResponse } from '../../types/SitemapTypes'

// Mock the api service
vi.mock('../apiService')

const mockedApiClient = vi.mocked(apiClient)

describe('generateSitemapService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call API with correct endpoint and data', async () => {
    const mockRequest: GenerateSitemapRequest = {
      questionnaire: {
        practiceDetails: 'Test Practice',
        siteVision: 'Test Vision',
        primaryAudience: 'Test Audience',
        secondaryAudience: 'Secondary Audience',
        demographics: 'Test Demographics',
        marketingGoals: 'Test Goals',
        brandPersonality: 'Professional',
        toneAndVoice: 'Friendly',
        contentPreferences: 'Detailed',
        visualStyle: 'Modern',
        competitiveAdvantage: 'Quality',
        callsToAction: 'Contact Us',
        socialProof: 'Testimonials',
        complianceRequirements: 'HIPAA',
        technicalRequirements: 'Responsive',
        maintenancePreferences: 'Low'
      },
      site_type: 'medical',
      use_page_json: true
    }

    const mockResponse: GenerateSitemapResponse = {
      sitemap_data: {
        pages: {
          home: {
            internal_id: 'home-123',
            page_id: 'wp-456',
            model_query_pairs: [
              { internal_id: 'item-1', model: 'gpt-4', query: 'home content' }
            ]
          }
        }
      }
    }

    mockedApiClient.post.mockResolvedValue(mockResponse)

    const result = await generateSitemapService(mockRequest)

    expect(mockedApiClient.post).toHaveBeenCalledTimes(1)
    expect(mockedApiClient.post).toHaveBeenCalledWith('/generate-sitemap/', mockRequest)
    expect(result).toEqual(mockResponse)
  })

  it('should handle API response correctly', async () => {
    const mockRequest: GenerateSitemapRequest = {
      questionnaire: {
        practiceDetails: 'Another Practice',
        siteVision: 'Another Vision',
        primaryAudience: 'Another Audience',
        secondaryAudience: 'Another Secondary',
        demographics: 'Another Demographics',
        marketingGoals: 'Another Goals',
        brandPersonality: 'Casual',
        toneAndVoice: 'Informal',
        contentPreferences: 'Brief',
        visualStyle: 'Minimal',
        competitiveAdvantage: 'Speed',
        callsToAction: 'Book Now',
        socialProof: 'Reviews',
        complianceRequirements: 'None',
        technicalRequirements: 'Mobile',
        maintenancePreferences: 'High'
      },
      site_type: 'restaurant',
      use_page_json: false
    }

    const mockResponse: GenerateSitemapResponse = {
      sitemap_data: {
        pages: {
          menu: {
            internal_id: 'menu-789',
            page_id: 'wp-012',
            model_query_pairs: [
              { internal_id: 'item-2', model: 'claude', query: 'menu content' },
              { internal_id: 'item-3', model: 'gpt-3.5', query: 'pricing info' }
            ]
          },
          about: {
            internal_id: 'about-345',
            page_id: 'wp-678',
            model_query_pairs: [
              { internal_id: 'item-4', model: 'gpt-4', query: 'restaurant story' }
            ]
          }
        }
      }
    }

    mockedApiClient.post.mockResolvedValue(mockResponse)

    const result = await generateSitemapService(mockRequest)

    expect(result).toEqual(mockResponse)
    expect(result.sitemap_data.pages).toHaveProperty('menu')
    expect(result.sitemap_data.pages).toHaveProperty('about')
    expect(result.sitemap_data.pages.menu.model_query_pairs).toHaveLength(2)
    expect(result.sitemap_data.pages.about.model_query_pairs).toHaveLength(1)
  })

  it('should propagate API errors', async () => {
    const mockRequest: GenerateSitemapRequest = {
      questionnaire: {
        practiceDetails: 'Error Practice',
        siteVision: 'Error Vision',
        primaryAudience: 'Error Audience',
        secondaryAudience: 'Error Secondary',
        demographics: 'Error Demographics',
        marketingGoals: 'Error Goals',
        brandPersonality: 'Error Personality',
        toneAndVoice: 'Error Voice',
        contentPreferences: 'Error Preferences',
        visualStyle: 'Error Style',
        competitiveAdvantage: 'Error Advantage',
        callsToAction: 'Error CTA',
        socialProof: 'Error Proof',
        complianceRequirements: 'Error Compliance',
        technicalRequirements: 'Error Technical',
        maintenancePreferences: 'Error Maintenance'
      },
      site_type: 'legal',
      use_page_json: true
    }

    const apiError = new Error('API Error: Invalid request')
    mockedApiClient.post.mockRejectedValue(apiError)

    await expect(generateSitemapService(mockRequest)).rejects.toThrow('API Error: Invalid request')
    expect(mockedApiClient.post).toHaveBeenCalledWith('/generate-sitemap/', mockRequest)
  })

  it('should handle network errors', async () => {
    const mockRequest: GenerateSitemapRequest = {
      questionnaire: {
        practiceDetails: 'Network Test',
        siteVision: 'Network Vision',
        primaryAudience: 'Network Audience',
        secondaryAudience: 'Network Secondary',
        demographics: 'Network Demographics',
        marketingGoals: 'Network Goals',
        brandPersonality: 'Network Personality',
        toneAndVoice: 'Network Voice',
        contentPreferences: 'Network Preferences',
        visualStyle: 'Network Style',
        competitiveAdvantage: 'Network Advantage',
        callsToAction: 'Network CTA',
        socialProof: 'Network Proof',
        complianceRequirements: 'Network Compliance',
        technicalRequirements: 'Network Technical',
        maintenancePreferences: 'Network Maintenance'
      },
      site_type: 'retail',
      use_page_json: false
    }

    const networkError = new Error('Network Error: Unable to connect')
    mockedApiClient.post.mockRejectedValue(networkError)

    await expect(generateSitemapService(mockRequest)).rejects.toThrow('Network Error: Unable to connect')
  })

  it('should handle empty sitemap response', async () => {
    const mockRequest: GenerateSitemapRequest = {
      questionnaire: {
        practiceDetails: 'Empty Test',
        siteVision: 'Empty Vision',
        primaryAudience: 'Empty Audience',
        secondaryAudience: 'Empty Secondary',
        demographics: 'Empty Demographics',
        marketingGoals: 'Empty Goals',
        brandPersonality: 'Empty Personality',
        toneAndVoice: 'Empty Voice',
        contentPreferences: 'Empty Preferences',
        visualStyle: 'Empty Style',
        competitiveAdvantage: 'Empty Advantage',
        callsToAction: 'Empty CTA',
        socialProof: 'Empty Proof',
        complianceRequirements: 'Empty Compliance',
        technicalRequirements: 'Empty Technical',
        maintenancePreferences: 'Empty Maintenance'
      },
      site_type: 'nonprofit',
      use_page_json: true
    }

    const mockResponse: GenerateSitemapResponse = {
      sitemap_data: {
        pages: {}
      }
    }

    mockedApiClient.post.mockResolvedValue(mockResponse)

    const result = await generateSitemapService(mockRequest)

    expect(result).toEqual(mockResponse)
    expect(Object.keys(result.sitemap_data.pages)).toHaveLength(0)
  })

  it('should pass through use_page_json parameter correctly', async () => {
    const requestWithPageJson: GenerateSitemapRequest = {
      questionnaire: {
        practiceDetails: 'Page JSON Test',
        siteVision: 'Page JSON Vision',
        primaryAudience: 'Page JSON Audience',
        secondaryAudience: 'Page JSON Secondary',
        demographics: 'Page JSON Demographics',
        marketingGoals: 'Page JSON Goals',
        brandPersonality: 'Page JSON Personality',
        toneAndVoice: 'Page JSON Voice',
        contentPreferences: 'Page JSON Preferences',
        visualStyle: 'Page JSON Style',
        competitiveAdvantage: 'Page JSON Advantage',
        callsToAction: 'Page JSON CTA',
        socialProof: 'Page JSON Proof',
        complianceRequirements: 'Page JSON Compliance',
        technicalRequirements: 'Page JSON Technical',
        maintenancePreferences: 'Page JSON Maintenance'
      },
      site_type: 'technology',
      use_page_json: true
    }

    const requestWithoutPageJson: GenerateSitemapRequest = {
      ...requestWithPageJson,
      use_page_json: false
    }

    const mockResponse: GenerateSitemapResponse = {
      sitemap_data: { pages: {} }
    }

    mockedApiClient.post.mockResolvedValue(mockResponse)

    // Test with use_page_json: true
    await generateSitemapService(requestWithPageJson)
    expect(mockedApiClient.post).toHaveBeenLastCalledWith('/generate-sitemap/', requestWithPageJson)

    // Test with use_page_json: false
    await generateSitemapService(requestWithoutPageJson)
    expect(mockedApiClient.post).toHaveBeenLastCalledWith('/generate-sitemap/', requestWithoutPageJson)
  })
})