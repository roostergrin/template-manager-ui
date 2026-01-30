import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Map,
  ArrowDown,
  ArrowRight,
  Server,
  Globe,
  Database,
  Layout,
  FileText,
  Image,
  Shield,
  Upload,
  CheckCircle,
  Palette,
} from 'lucide-react';
import './WorkflowDiagram.sass';

interface StepInfo {
  id: string;
  name: string;
  icon: React.ReactNode;
  phase: 'infrastructure' | 'planning' | 'deployment';
  endpoint?: string;
  inputs: string[];
  outputs: string[];
  dependsOn: string[];
}

const WORKFLOW_STEPS: StepInfo[] = [
  {
    id: 'provision-site',
    name: 'Provision Site',
    icon: <Server size={16} />,
    phase: 'infrastructure',
    endpoint: 'POST /provision/',
    inputs: ['domain'],
    outputs: ['bucket', 'cloudfront_distribution_id', 'assets_distribution_id', 'pipeline_name'],
    dependsOn: [],
  },
  {
    id: 'scrape-site',
    name: 'Scrape Site',
    icon: <Globe size={16} />,
    phase: 'planning',
    endpoint: 'POST /scrape-site/',
    inputs: ['scrapeDomain'],
    outputs: ['pages', 'global_markdown', 'style_overview', 'designSystem'],
    dependsOn: [],
  },
  {
    id: 'create-vector-store',
    name: 'Create Vector Store',
    icon: <Database size={16} />,
    phase: 'planning',
    endpoint: 'POST /create-vector-store/',
    inputs: ['pages', 'domain'],
    outputs: ['vector_store_id', 'page_count'],
    dependsOn: ['scrape-site'],
  },
  {
    id: 'select-template',
    name: 'Select Template',
    icon: <Layout size={16} />,
    phase: 'planning',
    endpoint: undefined,
    inputs: ['user selection'],
    outputs: ['template (e.g., stinson)', 'default sitemap'],
    dependsOn: ['create-vector-store'],
  },
  {
    id: 'allocate-content',
    name: 'Allocate Content',
    icon: <FileText size={16} />,
    phase: 'planning',
    endpoint: 'POST /allocate-content-to-sitemap/',
    inputs: ['vector_store_id', 'default sitemap', 'domain'],
    outputs: ['allocatedSitemap (with allocated_markdown)', 'allocationSummary'],
    dependsOn: ['create-vector-store', 'select-template'],
  },
  {
    id: 'generate-sitemap',
    name: 'Generate Sitemap',
    icon: <Map size={16} />,
    phase: 'planning',
    endpoint: 'Uses allocatedSitemap directly',
    inputs: ['allocatedSitemap'],
    outputs: ['sitemapResult.pages'],
    dependsOn: ['allocate-content'],
  },
  {
    id: 'generate-content',
    name: 'Generate Content',
    icon: <FileText size={16} />,
    phase: 'planning',
    endpoint: 'POST /generate-content/',
    inputs: ['sitemapResult.pages', 'questionnaireData (allocated_markdown)'],
    outputs: ['contentResult.pageData', 'contentResult.globalData'],
    dependsOn: ['generate-sitemap'],
  },
  {
    id: 'download-theme',
    name: 'Download Theme',
    icon: <Palette size={16} />,
    phase: 'planning',
    endpoint: 'POST /generate-theme/',
    inputs: ['designSystem'],
    outputs: ['themeResult.theme', 'theme.json file'],
    dependsOn: ['scrape-site'],
  },
  {
    id: 'image-picker',
    name: 'Image Picker',
    icon: <Image size={16} />,
    phase: 'planning',
    endpoint: 'POST /replace-images/',
    inputs: ['contentResult.pageData', 'preserveDoctorPhotos'],
    outputs: ['updated pageData with images'],
    dependsOn: ['generate-content'],
  },
  {
    id: 'prevent-hotlinking',
    name: 'Prevent Hotlinking',
    icon: <Shield size={16} />,
    phase: 'infrastructure',
    endpoint: 'POST /configure-s3-hotlink-protection/',
    inputs: ['bucket'],
    outputs: ['S3 bucket policy configured'],
    dependsOn: ['provision-site', 'image-picker'],
  },
  {
    id: 'export-to-wordpress',
    name: 'Export to WordPress',
    icon: <Upload size={16} />,
    phase: 'deployment',
    endpoint: 'POST /update-wordpress/',
    inputs: ['pageData', 'globalData', 'wordpress_api_url'],
    outputs: ['pagesUpdated', 'globalUpdated'],
    dependsOn: ['generate-content', 'image-picker'],
  },
  {
    id: 'second-pass',
    name: 'Second Pass',
    icon: <CheckCircle size={16} />,
    phase: 'deployment',
    endpoint: 'POST /wordpress-second-pass/',
    inputs: ['wordpress_api_url'],
    outputs: ['idsFixed', 'accessibilityFixes', 'imageSizeFixes'],
    dependsOn: ['export-to-wordpress'],
  },
  {
    id: 'upload-logo',
    name: 'Upload Logo',
    icon: <Image size={16} />,
    phase: 'deployment',
    endpoint: undefined,
    inputs: ['themeResult.theme'],
    outputs: ['logoUrl', 'headerVariant'],
    dependsOn: ['download-theme'],
  },
  {
    id: 'upload-favicon',
    name: 'Upload Favicon',
    icon: <Image size={16} />,
    phase: 'deployment',
    endpoint: undefined,
    inputs: ['themeResult.theme'],
    outputs: ['faviconUrl'],
    dependsOn: ['download-theme'],
  },
];

const PHASE_COLORS = {
  infrastructure: '#3b82f6',
  planning: '#8b5cf6',
  deployment: '#10b981',
};

const PHASE_LABELS = {
  infrastructure: 'Infrastructure',
  planning: 'Planning',
  deployment: 'Deployment',
};

const WorkflowDiagram: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  const getStepById = (id: string) => WORKFLOW_STEPS.find(s => s.id === id);

  const mainPipeline = [
    'scrape-site',
    'create-vector-store',
    'select-template',
    'allocate-content',
    'generate-sitemap',
    'generate-content',
    'image-picker',
    'export-to-wordpress',
    'second-pass',
  ];

  const parallelBranches = {
    'scrape-site': ['download-theme'],
    'provision-site': [],
    'download-theme': ['upload-logo', 'upload-favicon'],
    'image-picker': ['prevent-hotlinking'],
  };

  return (
    <div className="workflow-diagram">
      <button
        type="button"
        className="workflow-diagram__header"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label="Toggle workflow diagram"
      >
        <Map size={18} />
        <span className="workflow-diagram__title">Workflow Order & Deliverables</span>
        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {isExpanded && (
        <div className="workflow-diagram__content">
          {/* Legend */}
          <div className="workflow-diagram__legend">
            {Object.entries(PHASE_LABELS).map(([phase, label]) => (
              <div key={phase} className="workflow-diagram__legend-item">
                <span
                  className="workflow-diagram__legend-dot"
                  style={{ backgroundColor: PHASE_COLORS[phase as keyof typeof PHASE_COLORS] }}
                />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Main Flow */}
          <div className="workflow-diagram__flow">
            {/* Infrastructure parallel track */}
            <div className="workflow-diagram__track workflow-diagram__track--infrastructure">
              <div className="workflow-diagram__track-label">Infrastructure</div>
              <div className="workflow-diagram__step-card workflow-diagram__step-card--infrastructure">
                <Server size={14} />
                <span>Provision Site</span>
              </div>
              <div className="workflow-diagram__connector workflow-diagram__connector--vertical" />
              <div className="workflow-diagram__step-card workflow-diagram__step-card--infrastructure">
                <Shield size={14} />
                <span>Hotlink Protection</span>
              </div>
            </div>

            {/* Main pipeline */}
            <div className="workflow-diagram__main-pipeline">
              {mainPipeline.map((stepId, index) => {
                const step = getStepById(stepId);
                if (!step) return null;

                return (
                  <React.Fragment key={stepId}>
                    <button
                      type="button"
                      className={`workflow-diagram__step workflow-diagram__step--${step.phase} ${
                        selectedStep === stepId ? 'workflow-diagram__step--selected' : ''
                      }`}
                      onClick={() => setSelectedStep(selectedStep === stepId ? null : stepId)}
                      style={{ borderColor: PHASE_COLORS[step.phase] }}
                    >
                      <div className="workflow-diagram__step-header">
                        {step.icon}
                        <span className="workflow-diagram__step-name">{step.name}</span>
                      </div>
                      {step.endpoint && (
                        <code className="workflow-diagram__step-endpoint">{step.endpoint}</code>
                      )}
                    </button>

                    {/* Show parallel branches */}
                    {parallelBranches[stepId as keyof typeof parallelBranches]?.length > 0 && (
                      <div className="workflow-diagram__branch">
                        <ArrowRight size={12} className="workflow-diagram__branch-arrow" />
                        <div className="workflow-diagram__branch-steps">
                          {parallelBranches[stepId as keyof typeof parallelBranches].map(branchId => {
                            const branchStep = getStepById(branchId);
                            if (!branchStep) return null;
                            return (
                              <button
                                key={branchId}
                                type="button"
                                className={`workflow-diagram__step workflow-diagram__step--${branchStep.phase} workflow-diagram__step--branch ${
                                  selectedStep === branchId ? 'workflow-diagram__step--selected' : ''
                                }`}
                                onClick={() => setSelectedStep(selectedStep === branchId ? null : branchId)}
                                style={{ borderColor: PHASE_COLORS[branchStep.phase] }}
                              >
                                {branchStep.icon}
                                <span>{branchStep.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {index < mainPipeline.length - 1 && (
                      <ArrowDown size={16} className="workflow-diagram__arrow" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Selected Step Details */}
          {selectedStep && (
            <div className="workflow-diagram__details">
              {(() => {
                const step = getStepById(selectedStep);
                if (!step) return null;
                return (
                  <>
                    <h4 className="workflow-diagram__details-title">
                      {step.icon}
                      {step.name}
                    </h4>
                    {step.endpoint && (
                      <div className="workflow-diagram__details-row">
                        <span className="workflow-diagram__details-label">Endpoint:</span>
                        <code>{step.endpoint}</code>
                      </div>
                    )}
                    <div className="workflow-diagram__details-row">
                      <span className="workflow-diagram__details-label">Requires:</span>
                      <ul className="workflow-diagram__details-list">
                        {step.inputs.map((input, i) => (
                          <li key={i}>{input}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="workflow-diagram__details-row">
                      <span className="workflow-diagram__details-label">Produces:</span>
                      <ul className="workflow-diagram__details-list workflow-diagram__details-list--outputs">
                        {step.outputs.map((output, i) => (
                          <li key={i}>{output}</li>
                        ))}
                      </ul>
                    </div>
                    {step.dependsOn.length > 0 && (
                      <div className="workflow-diagram__details-row">
                        <span className="workflow-diagram__details-label">Depends on:</span>
                        <div className="workflow-diagram__details-deps">
                          {step.dependsOn.map(depId => {
                            const depStep = getStepById(depId);
                            return depStep ? (
                              <span key={depId} className="workflow-diagram__dep-tag">
                                {depStep.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Deliverables Summary Table */}
          <div className="workflow-diagram__table-container">
            <h4 className="workflow-diagram__table-title">Key Deliverables Flow</h4>
            <table className="workflow-diagram__table">
              <thead>
                <tr>
                  <th>Step</th>
                  <th>Key Output</th>
                  <th>Used By</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Scrape</td>
                  <td><code>pages</code>, <code>global_markdown</code>, <code>style_overview</code></td>
                  <td>Vector Store, Theme</td>
                </tr>
                <tr>
                  <td>Vector Store</td>
                  <td><code>vector_store_id</code></td>
                  <td>Allocate Content</td>
                </tr>
                <tr>
                  <td>Select Template</td>
                  <td><code>template</code>, default sitemap</td>
                  <td>Allocate Content</td>
                </tr>
                <tr>
                  <td>Allocate Content</td>
                  <td><code>allocatedSitemap</code> with <code>allocated_markdown</code></td>
                  <td>Generate Sitemap</td>
                </tr>
                <tr>
                  <td>Generate Sitemap</td>
                  <td><code>sitemapResult.pages</code></td>
                  <td>Generate Content</td>
                </tr>
                <tr>
                  <td>Generate Content</td>
                  <td><code>pageData</code>, <code>globalData</code></td>
                  <td>Image Picker, Export</td>
                </tr>
                <tr>
                  <td>Image Picker</td>
                  <td>Updated <code>pageData</code> with images</td>
                  <td>Export to WordPress</td>
                </tr>
                <tr>
                  <td>Export to WP</td>
                  <td>WordPress pages updated</td>
                  <td>Second Pass</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowDiagram;
