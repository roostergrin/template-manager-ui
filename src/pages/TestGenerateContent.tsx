import React from 'react';
import useGenerateContent from '../hooks/useGenerateContent';
import { GenerateContentRequest } from '../types/APIServiceTypes';

const defaultPages = [
  { id: 'home', title: 'Home', slug: 'index' },
  { id: 'about', title: 'About', slug: 'about' }
];

const defaultQuestionnaire = {
  siteName: 'Test Site',
  style: 'modern',
  targetAudience: 'general'
};

const containerStyle: React.CSSProperties = {
  maxWidth: 960,
  margin: '24px auto',
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 16
};

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16
};

const cardStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 16,
  background: '#fff'
};

const labelStyle: React.CSSProperties = { fontWeight: 600, marginBottom: 8, display: 'block' };

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 180,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontSize: 13,
  border: '1px solid #d1d5db',
  borderRadius: 6,
  padding: 8
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  padding: '8px 10px'
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 6,
  border: '1px solid #111827',
  background: '#111827',
  color: '#fff',
  cursor: 'pointer'
};

const subtleButtonStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 6,
  border: '1px solid #d1d5db',
  background: '#fff',
  color: '#111827',
  cursor: 'pointer'
};

const preStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 240,
  whiteSpace: 'pre-wrap',
  background: '#0b1020',
  color: '#e5e7eb',
  borderRadius: 8,
  padding: 16,
  overflow: 'auto'
};

const TestGenerateContent: React.FC = () => {
  const [, status, mutateAsync] = useGenerateContent();
  const [siteType, setSiteType] = React.useState<string>('stinson');
  const [assignImages, setAssignImages] = React.useState<boolean>(false);
  const [pagesText, setPagesText] = React.useState<string>(JSON.stringify(defaultPages, null, 2));
  const [questionnaireText, setQuestionnaireText] = React.useState<string>(JSON.stringify(defaultQuestionnaire, null, 2));
  const [error, setError] = React.useState<string | null>(null);
  const [response, setResponse] = React.useState<unknown>(null);

  const loading = status === 'pending';

  const useExample = React.useCallback(() => {
    setPagesText(JSON.stringify(defaultPages, null, 2));
    setQuestionnaireText(JSON.stringify(defaultQuestionnaire, null, 2));
  }, []);

  const submit = React.useCallback(async () => {
    setError(null);
    setResponse(null);
    let pages: unknown;
    let questionnaireData: unknown;
    try {
      pages = JSON.parse(pagesText);
    } catch (e) {
      setError('Invalid JSON in Pages');
      return;
    }
    try {
      questionnaireData = JSON.parse(questionnaireText);
    } catch (e) {
      setError('Invalid JSON in Questionnaire Data');
      return;
    }

    const request: GenerateContentRequest = {
      sitemap_data: { pages, questionnaireData: questionnaireData as Record<string, unknown> },
      site_type: siteType,
      assign_images: assignImages
    };

    try {
      const result = await mutateAsync(request);
      setResponse(result);
    } catch (e: unknown) {
      const message = (e as { message?: string })?.message || 'Request failed';
      setError(message);
    }
  }, [pagesText, questionnaireText, siteType, assignImages, mutateAsync]);

  return (
    <div style={containerStyle}>
      <h2>Generate Content Tester</h2>
      <div style={rowStyle}>
        <div style={cardStyle}>
          <label style={labelStyle} htmlFor="site-type">Site Type</label>
          <input id="site-type" style={inputStyle} value={siteType} onChange={e => setSiteType(e.target.value)} placeholder="e.g., stinson" />
          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={assignImages} onChange={e => setAssignImages(e.target.checked)} />
              Assign images
            </label>
            {assignImages && (
              <div style={{ 
                marginTop: 12, 
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 8,
                color: '#fff',
                fontSize: '14px',
                border: '1px solid #5a67d8'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: '16px' }}>🎨</span>
                  <strong>Adobe Licensed Assets Mode</strong>
                </div>
                <div style={{ fontSize: '13px', opacity: 0.9, lineHeight: 1.4 }}>
                  When ImageSelectionHints are detected in content, the system will use <strong>keywordMode=AND</strong> to search Adobe's licensed asset library for contextually appropriate images.
                </div>
                <div style={{ marginTop: 8, fontSize: '12px', opacity: 0.8 }}>
                  💡 Hint categories like "Home Hero" → "smiling AND dentist AND patient"
                </div>
              </div>
            )}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" style={subtleButtonStyle} onClick={useExample} aria-label="Use example data">Use example data</button>
            <button type="button" style={buttonStyle} onClick={submit} disabled={loading} aria-label="Send request">
              {loading ? 'Sending…' : 'Send request'}
            </button>
          </div>
        </div>
      </div>

      <div style={rowStyle}>
        <div style={cardStyle}>
          <label style={labelStyle} htmlFor="pages">Pages (JSON)</label>
          <textarea id="pages" style={textareaStyle} value={pagesText} onChange={e => setPagesText(e.target.value)} />
        </div>
        <div style={cardStyle}>
          <label style={labelStyle} htmlFor="questionnaire">Questionnaire Data (JSON)</label>
          <textarea id="questionnaire" style={textareaStyle} value={questionnaireText} onChange={e => setQuestionnaireText(e.target.value)} />
        </div>
      </div>

      {error && (
        <div style={{ ...cardStyle, borderColor: '#ef4444', color: '#991b1b', background: '#fef2f2' }} role="alert">
          {error}
        </div>
      )}

      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={labelStyle}>Response</div>
          {assignImages && response && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px',
              background: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: 6,
              fontSize: '12px',
              color: '#0369a1'
            }}>
              <span>🔍</span>
              Adobe search enabled
            </div>
          )}
        </div>
        <pre style={preStyle} aria-live="polite">{response ? JSON.stringify(response, null, 2) : 'No response yet.'}</pre>
      </div>
    </div>
  );
};

export default TestGenerateContent;


