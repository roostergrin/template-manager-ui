import React from 'react';

interface CollapsibleSectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, expanded, onToggle, children }) => (
  <div className="collapsible-section">
    <div className="section-header" onClick={onToggle}>
      <h3>{title}</h3>
      <div className={`collapse-icon ${expanded ? 'expanded' : ''}`}>▼</div>
    </div>
    <div className={`section-content ${expanded ? 'expanded' : ''}`}>
      {children}
    </div>
  </div>
);

export default CollapsibleSection; 