// Mock data for Theme generation step
import { ThemeStepResult } from '../../types/UnifiedWorkflowTypes';

export const createMockThemeResult = (): ThemeStepResult => {
  const theme = {
    default: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#F59E0B',
        background: '#FFFFFF',
        surface: '#F8FAFC',
        text: '#1F2937',
        textMuted: '#6B7280',
        border: '#E5E7EB',
        error: '#EF4444',
        success: '#22C55E',
        warning: '#F59E0B',
      },
      fonts: {
        heading: {
          family: 'Inter',
          weights: [600, 700],
        },
        body: {
          family: 'Open Sans',
          weights: [400, 500, 600],
        },
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        xxl: '3rem',
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '1rem',
        full: '9999px',
      },
      shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
      },
      logo_url: 'https://via.placeholder.com/200x60?text=Logo',
      favicon_url: 'https://via.placeholder.com/32x32?text=F',
      logo_config: {
        variant: 'dark',
        width: 200,
        height: 60,
      },
    },
  };

  return {
    success: true,
    theme,
    themeJson: JSON.stringify(theme, null, 2),
  };
};
