import React, { useState } from 'react';
import './ContextPreview.sass';

interface ScrapedSection {
  type: string;
  content: string;
  images: Array<{ url: string; alt?: string }>;
}

interface ScrapedPage {
  page_key: string;
  title: string;
  url: string;
  sections: ScrapedSection[];
}

interface ComponentModel {
  component: string;
  items?: string[];
}

interface ContextPreviewProps {
  scrapedPage: ScrapedPage | null;
  sitemapPage: {
    title: string;
    path: string;
    component: string;
    items?: string[];
  };
  componentModels?: ComponentModel[];
  onClose?: () => void;
}

const ContextPreview: React.FC<ContextPreviewProps> = ({
  scrapedPage,
  sitemapPage,
  componentModels,
  onClose,
}) => {
  const [selectedSection, setSelectedSection] = useState<number | null>(null);

  const getComponentDescription = (component: string): string => {
    const descriptions: { [key: string]: string } = {
      Hero: 'Large header section with headline, subheadline, and call-to-action',
      About: 'About section with descriptive text and optional image',
      Services: 'List of services with icons/images and descriptions',
      Team: 'Team member profiles with photos and bios',
      Testimonials: 'Customer testimonials and reviews',
      Contact: 'Contact information and form',
      FAQ: 'Frequently asked questions',
      Gallery: 'Image gallery or portfolio',
      Features: 'Product or service features list',
      CallToAction: 'Prominent call-to-action section',
    };
    return descriptions[component] || 'Generic content component';
  };

  const getExpectedItems = (component: string): string[] => {
    const expectedItems: { [key: string]: string[] } = {
      Hero: ['headline', 'subheadline', 'cta_text', 'background_image'],
      About: ['title', 'description', 'image'],
      Services: ['title', 'services[].name', 'services[].description', 'services[].icon'],
      Team: ['title', 'team_members[].name', 'team_members[].role', 'team_members[].bio', 'team_members[].photo'],
      Testimonials: ['title', 'testimonials[].author', 'testimonials[].text', 'testimonials[].rating'],
      Contact: ['title', 'phone', 'email', 'address', 'hours'],
      FAQ: ['title', 'faqs[].question', 'faqs[].answer'],
      Gallery: ['title', 'images[].url', 'images[].caption'],
      Features: ['title', 'features[].name', 'features[].description', 'features[].icon'],
      CallToAction: ['headline', 'description', 'button_text', 'button_link'],
    };
    return expectedItems[component] || ['content'];
  };

  const renderSectionMapping = (section: ScrapedSection, index: number) => {
    const isSelected = selectedSection === index;

    return (
      <div
        key={index}
        className={`section-mapping ${isSelected ? 'selected' : ''}`}
        onClick={() => setSelectedSection(isSelected ? null : index)}
      >
        <div className="section-header">
          <span className="section-type">{section.type}</span>
          <span className="section-preview">
            {section.content.substring(0, 60)}
            {section.content.length > 60 ? '...' : ''}
          </span>
        </div>
        {isSelected && (
          <div className="section-detail">
            <div className="section-content">
              <h5>Content:</h5>
              <p>{section.content}</p>
            </div>
            {section.images.length > 0 && (
              <div className="section-images">
                <h5>Images ({section.images.length}):</h5>
                <div className="image-list">
                  {section.images.map((img, imgIdx) => (
                    <div key={imgIdx} className="image-preview">
                      <img
                        src={img.url}
                        alt={img.alt || `Image ${imgIdx + 1}`}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="context-preview">
      <div className="context-preview__header">
        <h3>🔍 Context Preview</h3>
        {onClose && (
          <button className="btn btn--close" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      <div className="context-preview__content">
        {/* Left Column: Sitemap Page Info */}
        <div className="sitemap-info-column">
          <h4>🎯 Target Sitemap Page</h4>
          <div className="info-card">
            <div className="info-row">
              <span className="label">Title:</span>
              <span className="value">{sitemapPage.title}</span>
            </div>
            <div className="info-row">
              <span className="label">Path:</span>
              <span className="value">{sitemapPage.path}</span>
            </div>
            <div className="info-row">
              <span className="label">Component:</span>
              <span className="value component-badge">{sitemapPage.component}</span>
            </div>
            <div className="info-description">
              <p>{getComponentDescription(sitemapPage.component)}</p>
            </div>
          </div>

          <div className="expected-items">
            <h5>Expected Data Fields:</h5>
            <ul>
              {getExpectedItems(sitemapPage.component).map((item, idx) => (
                <li key={idx}>
                  <code>{item}</code>
                </li>
              ))}
            </ul>
          </div>

          {sitemapPage.items && sitemapPage.items.length > 0 && (
            <div className="sitemap-items">
              <h5>Configured Items:</h5>
              <div className="items-list">
                {sitemapPage.items.map((item, idx) => (
                  <div key={idx} className="item-badge">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Scraped Content */}
        <div className="scraped-context-column">
          <h4>📄 Scraped Content Context</h4>
          {scrapedPage ? (
            <div className="scraped-page-info">
              <div className="page-header-info">
                <h5>{scrapedPage.title}</h5>
                <p className="page-url">{scrapedPage.url}</p>
                <div className="page-stats">
                  <span>{scrapedPage.sections.length} sections</span>
                  <span>
                    {scrapedPage.sections.reduce((acc, s) => acc + s.images.length, 0)} images
                  </span>
                </div>
              </div>

              <div className="sections-container">
                <h5>Sections to be used:</h5>
                {scrapedPage.sections.length === 0 ? (
                  <p className="no-sections">No sections found</p>
                ) : (
                  scrapedPage.sections.map((section, idx) => renderSectionMapping(section, idx))
                )}
              </div>

              <div className="usage-info">
                <div className="info-banner">
                  <span className="info-icon">ℹ️</span>
                  <p>
                    This scraped content will be provided as context to the AI when generating
                    content for <strong>{sitemapPage.title}</strong>. The AI will extract
                    relevant information and adapt it to fit the{' '}
                    <strong>{sitemapPage.component}</strong> component format.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-mapping">
              <div className="no-mapping-message">
                <span className="icon">⚠️</span>
                <h5>No Scraped Content Mapped</h5>
                <p>
                  This sitemap page is not mapped to any scraped content. The AI will use the
                  questionnaire data instead.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="context-preview__howto">
        <h4>🤖 How Content Generation Works</h4>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h5>Extract Context</h5>
              <p>
                The AI receives the scraped page content including all sections, text, and image
                URLs.
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h5>Match to Component</h5>
              <p>
                The AI identifies which parts of the scraped content best match the target
                component's data model.
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h5>Transform & Generate</h5>
              <p>
                The AI transforms the scraped content to fit the component format, preserving
                meaning while adapting structure.
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h5>Fallback to Questionnaire</h5>
              <p>
                If specific fields can't be extracted from scraped content, the AI uses
                questionnaire data to fill gaps.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextPreview;
