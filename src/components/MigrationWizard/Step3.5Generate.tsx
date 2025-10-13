import React, { useState } from 'react';
import { Loader2, CheckCircle, Download, Copy, Check } from 'lucide-react';
import { useMigrationWizard } from '../../contexts/MigrationWizardProvider';
import { useSitemap } from '../../contexts/SitemapProvider';
import { useAppConfig } from '../../contexts/AppConfigProvider';
import useGenerateContent from '../../hooks/useGenerateContent';
import { getBackendSiteTypeForModelGroup } from '../../utils/modelGroupKeyToBackendSiteType';
import './Step3.5Generate.sass';

const Step3_5Generate: React.FC = () => {
  const { state, actions } = useMigrationWizard();
  const { state: sitemapState } = useSitemap();
  const { state: appConfigState } = useAppConfig();
  const [generateContentData, generateContentStatus, generateContentMutation] = useGenerateContent();
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  if (!state.scrapedContent) {
    return (
      <div className="step-3-5-generate__empty">
        <p>No scraped content available. Please complete Step 2 first.</p>
        <button className="btn btn--primary" onClick={() => actions.setCurrentStep('audit')}>
          Go to Step 2
        </button>
      </div>
    );
  }

  if (!sitemapState.pages || sitemapState.pages.length === 0) {
    return (
      <div className="step-3-5-generate__empty">
        <p>No sitemap structure available. Please complete Step 3 first.</p>
        <button className="btn btn--primary" onClick={() => actions.setCurrentStep('structure')}>
          Go to Step 3
        </button>
      </div>
    );
  }

  const selectedModelGroupKey = appConfigState.selectedModelGroupKey || Object.keys(appConfigState.modelGroups)[0];
  const backendSiteType = getBackendSiteTypeForModelGroup(selectedModelGroupKey) || 'stinson';
  const scrapedPages = state.scrapedContent.pages || {};
  const pagesCount = Object.keys(scrapedPages).length;

  const handleGenerate = async () => {
    try {
      // Combine global_markdown and all page markdowns into a single context string
      const allMarkdown = [
        '# Global Content',
        state.scrapedContent.global_markdown,
        '\n# Pages',
        ...Object.entries(state.scrapedContent.pages).map(([url, markdown]) =>
          `\n## ${url}\n${markdown}`
        )
      ].join('\n\n');

      console.log('🔍 Scraped content being sent to backend:');
      console.log('- Global markdown length:', state.scrapedContent.global_markdown.length, 'characters');
      console.log('- Number of pages:', Object.keys(state.scrapedContent.pages).length);
      console.log('- Total combined markdown length:', allMarkdown.length, 'characters');
      console.log('- First 500 chars of combined markdown:', allMarkdown.substring(0, 500));

      // Convert scraped markdown content to questionnaire data format
      // The backend expects questionnaire data, so we put all scraped content in practiceDetails
      const questionnaireDataFromScrape = {
        practiceDetails: allMarkdown,
        siteVision: '',
        primaryAudience: '',
        secondaryAudience: '',
        demographics: '',
        uniqueQualities: '',
        contentCreation: 'new' as const,
        hasBlog: false,
        blogType: '',
        topTreatments: '',
        writingStyle: '',
        topicsToAvoid: '',
        communityEngagement: '',
        testimonials: '',
        patientExperience: '',
        financialOptions: '',
        // Add metadata to indicate this is from scraped content
        _isScrapedContent: true,
        _domain: state.scrapedContent.domain,
        _scrapedAt: state.scrapedContent.metadata.scraped_at,
      };

      console.log('📦 Request payload:', {
        sitemap_pages_count: sitemapState.pages.length,
        questionnaire_practiceDetails_length: questionnaireDataFromScrape.practiceDetails.length,
        site_type: backendSiteType,
        assign_images: true,
      });

      const result = await generateContentMutation({
        sitemap_data: {
          pages: sitemapState.pages,
          questionnaireData: questionnaireDataFromScrape as any,
        },
        site_type: backendSiteType,
        assign_images: true,
      });

      actions.setGeneratedContent(result);
    } catch (error) {
      console.error('Content generation failed:', error);
    }
  };

  const handleDownload = () => {
    if (!generateContentData) return;
    const blob = new Blob([JSON.stringify(generateContentData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-content.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!generateContentData) return;
    navigator.clipboard.writeText(JSON.stringify(generateContentData, null, 2));
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };

  const isGenerating = generateContentStatus === 'pending';
  const hasGenerated = generateContentStatus === 'success' && generateContentData;

  const globalMarkdownLength = state.scrapedContent.global_markdown.length;
  const totalScrapedChars = globalMarkdownLength + Object.values(state.scrapedContent.pages).reduce((sum, md) => sum + md.length, 0);

  return (
    <div className="step-3-5-generate">
      <div className="step-3-5-generate__summary">
        <h3>Ready to Generate Content</h3>
        <div className="step-3-5-generate__info">
          <div className="info-badge">
            <span className="info-badge__label">Domain:</span>
            <span className="info-badge__value">{state.scrapedContent.domain}</span>
          </div>
          <div className="info-badge">
            <span className="info-badge__label">Pages Scraped:</span>
            <span className="info-badge__value">{pagesCount}</span>
          </div>
          <div className="info-badge">
            <span className="info-badge__label">Site Type:</span>
            <span className="info-badge__value">{backendSiteType}</span>
          </div>
          <div className="info-badge">
            <span className="info-badge__label">Sitemap Sections:</span>
            <span className="info-badge__value">{sitemapState.pages.length}</span>
          </div>
        </div>
        <div className="step-3-5-generate__context-info">
          <p>
            📝 Using scraped content as context: <strong>{totalScrapedChars.toLocaleString()}</strong> characters from <strong>{pagesCount + 1}</strong> sources (global + {pagesCount} pages)
          </p>
        </div>
      </div>

      <div className="step-3-5-generate__actions">
        {!hasGenerated && (
          <button
            className="btn btn--primary btn--large"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="spinning" size={20} />
                Generating Content...
              </>
            ) : (
              <>
                ✨ Generate Content
              </>
            )}
          </button>
        )}

        {hasGenerated && (
          <div className="step-3-5-generate__success">
            <div className="success-message">
              <CheckCircle size={24} className="success-icon" />
              <p>Content generated successfully!</p>
            </div>
            <div className="action-buttons">
              <button className="btn btn--primary" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="spinning" size={18} />
                    Regenerating...
                  </>
                ) : (
                  '✨ Generate Again'
                )}
              </button>
              <button className="btn btn--secondary" onClick={handleDownload}>
                <Download size={18} />
                Download JSON
              </button>
              <button className="btn btn--secondary" onClick={handleCopy}>
                {copiedToClipboard ? <Check size={18} /> : <Copy size={18} />}
                {copiedToClipboard ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
          </div>
        )}
      </div>

      {isGenerating && (
        <div className="step-3-5-generate__progress">
          <Loader2 className="progress-spinner spinning" size={48} />
          <p>Generating content from your scraped data and sitemap structure...</p>
          <p className="progress-note">This may take a minute or two.</p>
        </div>
      )}

      {hasGenerated && generateContentData && (
        <div className="step-3-5-generate__preview">
          <h4>Generated Content Preview</h4>
          <textarea
            className="content-preview"
            value={JSON.stringify(generateContentData, null, 2)}
            readOnly
            rows={12}
          />
        </div>
      )}
    </div>
  );
};

export default Step3_5Generate;
