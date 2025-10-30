import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../test/utils'
import GenerateSitemapButton, { GenerateSitemapButtonProps } from '../GenerateSitemapButton'
import { QuestionnaireData } from '../../types/SitemapTypes'

// Mock LoadingOverlay component
vi.mock('../LoadingOverlay', () => ({
  default: () => <div data-testid="loading-overlay">Loading...</div>
}))

const mockQuestionnaireData: QuestionnaireData = {
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
}

const defaultProps: GenerateSitemapButtonProps = {
  questionnaireData: mockQuestionnaireData,
  generateSitemap: vi.fn(),
  generateSitemapStatus: 'idle',
  onSitemapGenerated: vi.fn(),
  controls: {
    backendSiteType: 'medical'
  }
}

describe('GenerateSitemapButton', () => {
  it('should render all UI elements correctly', () => {
    render(<GenerateSitemapButton {...defaultProps} />)

    // Check site type display
    expect(screen.getByText('Current Site Type:')).toBeInTheDocument()
    expect(screen.getByText('medical')).toBeInTheDocument()

    // Check "Using Page JSON" text
    expect(screen.getByText('Using Page JSON')).toBeInTheDocument()

    // Check button
    const button = screen.getByRole('button', { name: 'Generate Sitemap' })
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
  })

  it('should call generateSitemap with correct parameters when button is clicked', () => {
    const mockGenerate = vi.fn()
    const props = {
      ...defaultProps,
      generateSitemap: mockGenerate,
      controls: {
        backendSiteType: 'restaurant'
      }
    }

    render(<GenerateSitemapButton {...props} />)

    const button = screen.getByRole('button', { name: 'Generate Sitemap' })
    fireEvent.click(button)

    expect(mockGenerate).toHaveBeenCalledTimes(1)
    expect(mockGenerate).toHaveBeenCalledWith({
      questionnaire: mockQuestionnaireData,
      site_type: 'restaurant',
      use_page_json: true
    })
  })

  it('should show loading overlay when status is pending', () => {
    const props = {
      ...defaultProps,
      generateSitemapStatus: 'pending' as const
    }
    
    render(<GenerateSitemapButton {...props} />)
    
    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument()
  })

  it('should disable button when status is pending', () => {
    const props = {
      ...defaultProps,
      generateSitemapStatus: 'pending' as const
    }
    
    render(<GenerateSitemapButton {...props} />)
    
    const button = screen.getByRole('button', { name: 'Generate Sitemap' })
    expect(button).toBeDisabled()
  })

  it('should not show loading overlay when status is not pending', () => {
    render(<GenerateSitemapButton {...defaultProps} />)
    
    expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument()
  })

  it('should call onSitemapGenerated when successful response is received', () => {
    const mockOnGenerated = vi.fn()
    const mockSitemapData = {
      sitemap_data: {
        pages: {
          home: { title: 'Home', content: 'Home content' }
        }
      }
    }
    
    const props = {
      ...defaultProps,
      generateSitemapStatus: 'success' as const,
      generateSitemapData: mockSitemapData,
      onSitemapGenerated: mockOnGenerated
    }
    
    render(<GenerateSitemapButton {...props} />)
    
    expect(mockOnGenerated).toHaveBeenCalledTimes(1)
    expect(mockOnGenerated).toHaveBeenCalledWith(mockSitemapData.sitemap_data)
  })

  it('should not call onSitemapGenerated when response lacks pages', () => {
    const mockOnGenerated = vi.fn()
    const mockSitemapData = {
      sitemap_data: {
        // Missing pages property
        metadata: { version: '1.0' }
      }
    }
    
    const props = {
      ...defaultProps,
      generateSitemapStatus: 'success' as const,
      generateSitemapData: mockSitemapData,
      onSitemapGenerated: mockOnGenerated
    }
    
    render(<GenerateSitemapButton {...props} />)
    
    expect(mockOnGenerated).not.toHaveBeenCalled()
  })

  it('should have proper accessibility attributes', () => {
    render(<GenerateSitemapButton {...defaultProps} />)

    // Check site type span accessibility
    const siteTypeElement = screen.getByLabelText('Current Site Type')
    expect(siteTypeElement).toHaveAttribute('tabIndex', '0')

    // Check button accessibility
    const button = screen.getByRole('button', { name: 'Generate Sitemap' })
    expect(button).toHaveAttribute('tabIndex', '0')
    expect(button).toHaveAttribute('aria-label', 'Generate Sitemap')
  })

  it('should handle different backend site types', () => {
    const props = {
      ...defaultProps,
      controls: {
        ...defaultProps.controls,
        backendSiteType: 'legal'
      }
    }
    
    render(<GenerateSitemapButton {...props} />)
    
    expect(screen.getByText('legal')).toBeInTheDocument()
  })

  it('should handle error status gracefully', () => {
    const props = {
      ...defaultProps,
      generateSitemapStatus: 'error' as const
    }
    
    render(<GenerateSitemapButton {...props} />)
    
    // Button should be available for retry
    const button = screen.getByRole('button', { name: 'Generate Sitemap' })
    expect(button).not.toBeDisabled()
    expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument()
  })
})