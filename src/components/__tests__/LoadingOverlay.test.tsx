import { describe, it, expect } from 'vitest'
import { render, screen } from '../../test/utils'
import LoadingOverlay from '../LoadingOverlay'

describe('LoadingOverlay', () => {
  it('should render loading spinner and text', () => {
    const { getByRole, getByText } = render(<LoadingOverlay />)
    
    // Check for status role and aria attributes
    const statusElement = getByRole('status')
    expect(statusElement).toBeInTheDocument()
    expect(statusElement).toHaveAttribute('aria-live', 'polite')
    expect(statusElement).toHaveAttribute('aria-label', 'Loading, please wait')
    expect(statusElement).toHaveAttribute('tabIndex', '0')
    
    // Check for loading text (there are multiple instances, so use getAllByText)
    const loadingTexts = screen.getAllByText('Loading, please wait...')
    expect(loadingTexts).toHaveLength(2) // One visible, one sr-only
  })

  it('should have proper CSS classes for styling', () => {
    const { container } = render(<LoadingOverlay />)
    
    const overlay = container.querySelector('.loading-overlay')
    expect(overlay).toBeInTheDocument()
    
    const content = container.querySelector('.loading-overlay__content')
    expect(content).toBeInTheDocument()
    
    const spinner = container.querySelector('.loading-overlay__spinner')
    expect(spinner).toBeInTheDocument()
    
    const text = container.querySelector('.loading-overlay__text')
    expect(text).toBeInTheDocument()
  })

  it('should have proper SVG spinner structure', () => {
    const { container } = render(<LoadingOverlay />)
    
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg')
    expect(svg).toHaveAttribute('fill', 'none')
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    
    const circle = container.querySelector('circle')
    expect(circle).toBeInTheDocument()
    expect(circle).toHaveAttribute('cx', '12')
    expect(circle).toHaveAttribute('cy', '12')
    expect(circle).toHaveAttribute('r', '10')
    
    const path = container.querySelector('path')
    expect(path).toBeInTheDocument()
  })

  it('should be accessible with screen reader text', () => {
    const { container } = render(<LoadingOverlay />)
    
    const srOnlyText = container.querySelector('.loading-overlay__sr-only')
    expect(srOnlyText).toBeInTheDocument()
    expect(srOnlyText).toHaveTextContent('Loading, please wait...')
  })
})