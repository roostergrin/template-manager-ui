import React from 'react';
import { ExternalLink } from 'lucide-react';
import { domainToSlug } from '../../utils/domainUtils';

interface NavigationLinksProps {
  domain: string;
  githubRepo?: string;
}

export const NavigationLinks: React.FC<NavigationLinksProps> = ({
  domain,
  githubRepo,
}) => {
  if (!domain) return null;

  // Auto-derive WordPress admin URL from domain (e.g., example.com -> api-example-com.roostergrintemplates.com)
  const domainSlug = domainToSlug(domain);
  const wpAdminUrl = `https://api-${domainSlug}.roostergrintemplates.com/wp-admin/`;

  return (
    <div className="navigation-links">
      <h4 className="navigation-links__title">Quick Links</h4>
      <div className="navigation-links__list">
        <a
          href={`https://${domain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="navigation-links__link"
        >
          <ExternalLink size={14} />
          View JSON Site
        </a>
        <a
          href={wpAdminUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="navigation-links__link"
        >
          <ExternalLink size={14} />
          WordPress Admin
        </a>
        {githubRepo && (
          <a
            href={`https://github.com/roostergrin/${githubRepo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="navigation-links__link"
          >
            <ExternalLink size={14} />
            GitHub Repo
          </a>
        )}
      </div>
    </div>
  );
};

export default NavigationLinks;
