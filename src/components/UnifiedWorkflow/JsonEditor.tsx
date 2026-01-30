import React, { useState, useCallback, useEffect } from 'react';
import { Copy, Check, AlertCircle, RotateCcw } from 'lucide-react';

interface JsonEditorProps {
  data: unknown;
  onChange: (data: unknown) => void;
  readOnly?: boolean;
  className?: string;
}

const JsonEditor: React.FC<JsonEditorProps> = ({
  data,
  onChange,
  readOnly = false,
  className = '',
}) => {
  const [textValue, setTextValue] = useState<string>('');
  const [originalValue, setOriginalValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isModified, setIsModified] = useState(false);

  // Initialize text value from data
  useEffect(() => {
    try {
      const formatted = JSON.stringify(data, null, 2);
      setTextValue(formatted);
      setOriginalValue(formatted);
      setError(null);
      setIsModified(false);
    } catch (e) {
      setError('Failed to serialize data to JSON');
    }
  }, [data]);

  // Handle text changes with validation
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setTextValue(newValue);
    setIsModified(newValue !== originalValue);

    try {
      const parsed = JSON.parse(newValue);
      setError(null);
      onChange(parsed);
    } catch (e) {
      if (e instanceof SyntaxError) {
        setError(`Invalid JSON: ${e.message}`);
      } else {
        setError('Failed to parse JSON');
      }
    }
  }, [onChange, originalValue]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(textValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy to clipboard:', e);
    }
  }, [textValue]);

  // Reset to original value
  const handleReset = useCallback(() => {
    setTextValue(originalValue);
    setError(null);
    setIsModified(false);
    try {
      onChange(JSON.parse(originalValue));
    } catch (e) {
      // Should not happen since originalValue was valid JSON
    }
  }, [originalValue, onChange]);

  // Count lines for line numbers
  const lineCount = textValue.split('\n').length;

  return (
    <div className={`json-editor ${className} ${error ? 'json-editor--error' : ''} ${isModified ? 'json-editor--modified' : ''}`}>
      <div className="json-editor__toolbar">
        <div className="json-editor__status">
          {isModified && !error && (
            <span className="json-editor__modified-badge">Modified</span>
          )}
          {error && (
            <span className="json-editor__error-badge">
              <AlertCircle size={14} />
              Invalid
            </span>
          )}
        </div>
        <div className="json-editor__actions">
          {isModified && (
            <button
              type="button"
              className="json-editor__action-btn"
              onClick={handleReset}
              title="Reset to original"
              aria-label="Reset to original value"
            >
              <RotateCcw size={14} />
            </button>
          )}
          <button
            type="button"
            className="json-editor__action-btn"
            onClick={handleCopy}
            title="Copy to clipboard"
            aria-label="Copy JSON to clipboard"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      <div className="json-editor__container">
        <div className="json-editor__line-numbers" aria-hidden="true">
          {Array.from({ length: lineCount }, (_, i) => (
            <span key={i + 1}>{i + 1}</span>
          ))}
        </div>
        <textarea
          className="json-editor__textarea"
          value={textValue}
          onChange={handleChange}
          readOnly={readOnly}
          spellCheck={false}
          aria-label="JSON editor"
          aria-invalid={!!error}
          aria-describedby={error ? 'json-editor-error' : undefined}
        />
      </div>

      {error && (
        <div id="json-editor-error" className="json-editor__error-message">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
    </div>
  );
};

export default JsonEditor;
