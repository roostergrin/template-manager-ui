import { StepLogger } from '../../../utils/workflowLogger';
import { ScrapeStepResult, ThemeStepResult } from '../../../types/UnifiedWorkflowTypes';
import { buildThemeFromDesignSystem } from '../../../utils/themeBuilder';
import { StepResult, StepRunnerDeps } from './stepRunnerTypes';

export async function runDownloadTheme(deps: StepRunnerDeps, logger: StepLogger): Promise<StepResult> {
  const scrapeResult = deps.getGeneratedData<ScrapeStepResult>('scrapeResult');
  // Backend returns design_system (snake_case), not designSystem (camelCase)
  const scrapeResultAny = scrapeResult as Record<string, unknown> | undefined;
  const designSystem = (scrapeResultAny?.design_system || scrapeResultAny?.designSystem) as {
    images?: { logo?: string; favicon?: string };
    colors?: {
      primary?: string | null;
      accent?: string | null;
      background?: string | null;
      text_primary?: string | null;
      link?: string | null;
    };
    typography?: {
      font_families?: {
        primary?: string | null;
        heading?: string | null;
      };
    };
    logo_config?: { type: 'svg' | 'url'; variant: 'dark' | 'light'; url: string | null } | null;
    logo_colors?: {
      colors: Array<{ hex: string; luminosity_percent: number; count: number }>;
      dominant_color: string;
      avg_luminosity: number;
      is_light: boolean;
    } | null;
  } | undefined;

  // Use empty design system with defaults if not available
  const effectiveDesignSystem = designSystem || {};

  try {
    // Build theme client-side from design system (same as DesignSystemViewer)
    // Debug: Log scrape result keys to help diagnose issues
    logger.logProcessing(`Scrape result keys: ${scrapeResultAny ? Object.keys(scrapeResultAny).join(', ') : 'none'}`);
    logger.logProcessing(`design_system present: ${scrapeResultAny?.design_system ? 'yes' : 'no'}`);
    logger.logProcessing(`designSystem present: ${scrapeResultAny?.designSystem ? 'yes' : 'no'}`);

    if (!designSystem) {
      logger.logProcessing('WARNING: No design system data from scrape step - using defaults');
    } else {
      logger.logProcessing('Building theme from design system data');
      logger.logProcessing(`Design system keys: ${Object.keys(designSystem).join(', ')}`);
    }
    logger.logProcessing(`Design system logo: ${effectiveDesignSystem.images?.logo || 'none'}`);
    logger.logProcessing(`Design system favicon: ${effectiveDesignSystem.images?.favicon || 'none'}`);

    const theme = buildThemeFromDesignSystem(effectiveDesignSystem);

    // Log what we built
    logger.logProcessing(`Theme logo_url: ${theme.default.logo_url || 'none'}`);
    logger.logProcessing(`Theme logo_config: ${theme.default.logo_config ? JSON.stringify(theme.default.logo_config) : 'none'}`);
    logger.logProcessing(`Theme favicon_url: ${theme.default.favicon_url || 'none'}`);
    logger.logProcessing(`Theme colors: ${theme.default.colors.length} entries`);
    logger.logProcessing(`Theme typography: ${theme.default.typography.length} entries`);

    const response: ThemeStepResult = {
      success: true,
      theme,
      themeJson: JSON.stringify(theme, null, 2),
    };

    deps.setGeneratedDataWithRef('themeResult', response);

    // Trigger download of theme.json
    logger.logProcessing('Triggering theme.json download');
    const themeJson = JSON.stringify(theme, null, 2);
    const blob = new Blob([themeJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'theme.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Theme generation failed' };
  }
}
