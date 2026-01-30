import React, { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';

interface JsonViewerProps {
  data: unknown;
  maxStringLength?: number;
  initialExpanded?: boolean;
  className?: string;
}

interface JsonNodeProps {
  keyName?: string;
  value: unknown;
  depth: number;
  maxStringLength: number;
  initialExpanded: boolean;
}

const JsonNode: React.FC<JsonNodeProps> = ({
  keyName,
  value,
  depth,
  maxStringLength,
  initialExpanded,
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded && depth < 2);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const renderValue = (): React.ReactNode => {
    if (value === null) {
      return <span className="json-viewer__null">null</span>;
    }

    if (value === undefined) {
      return <span className="json-viewer__undefined">undefined</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="json-viewer__boolean">{value.toString()}</span>;
    }

    if (typeof value === 'number') {
      return <span className="json-viewer__number">{value}</span>;
    }

    if (typeof value === 'string') {
      const displayValue =
        value.length > maxStringLength
          ? `${value.substring(0, maxStringLength)}...`
          : value;
      return <span className="json-viewer__string">"{displayValue}"</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="json-viewer__bracket">[]</span>;
      }

      return (
        <div className="json-viewer__array">
          <button
            type="button"
            className="json-viewer__toggle"
            onClick={toggleExpand}
            aria-label={isExpanded ? 'Collapse array' : 'Expand array'}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="json-viewer__bracket">[</span>
            {!isExpanded && (
              <span className="json-viewer__preview">
                {value.length} item{value.length !== 1 ? 's' : ''}
              </span>
            )}
          </button>
          {isExpanded && (
            <div className="json-viewer__children">
              {value.map((item, index) => (
                <JsonNode
                  key={index}
                  keyName={String(index)}
                  value={item}
                  depth={depth + 1}
                  maxStringLength={maxStringLength}
                  initialExpanded={initialExpanded}
                />
              ))}
            </div>
          )}
          {isExpanded && <span className="json-viewer__bracket">]</span>}
        </div>
      );
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value as Record<string, unknown>);
      if (keys.length === 0) {
        return <span className="json-viewer__bracket">{'{}'}</span>;
      }

      return (
        <div className="json-viewer__object">
          <button
            type="button"
            className="json-viewer__toggle"
            onClick={toggleExpand}
            aria-label={isExpanded ? 'Collapse object' : 'Expand object'}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="json-viewer__bracket">{'{'}</span>
            {!isExpanded && (
              <span className="json-viewer__preview">
                {keys.length} key{keys.length !== 1 ? 's' : ''}
              </span>
            )}
          </button>
          {isExpanded && (
            <div className="json-viewer__children">
              {keys.map((key) => (
                <JsonNode
                  key={key}
                  keyName={key}
                  value={(value as Record<string, unknown>)[key]}
                  depth={depth + 1}
                  maxStringLength={maxStringLength}
                  initialExpanded={initialExpanded}
                />
              ))}
            </div>
          )}
          {isExpanded && <span className="json-viewer__bracket">{'}'}</span>}
        </div>
      );
    }

    return <span className="json-viewer__unknown">{String(value)}</span>;
  };

  return (
    <div className="json-viewer__node" style={{ paddingLeft: depth > 0 ? '1rem' : 0 }}>
      {keyName !== undefined && (
        <span className="json-viewer__key">{keyName}: </span>
      )}
      {renderValue()}
    </div>
  );
};

const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  maxStringLength = 100,
  initialExpanded = true,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [data]);

  if (data === undefined || data === null) {
    return (
      <div className={`json-viewer ${className}`.trim()}>
        <span className="json-viewer__null">{String(data)}</span>
      </div>
    );
  }

  return (
    <div className={`json-viewer ${className}`.trim()}>
      <div className="json-viewer__header">
        <button
          type="button"
          className="json-viewer__copy-btn"
          onClick={handleCopy}
          aria-label="Copy JSON"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="json-viewer__content">
        <JsonNode
          value={data}
          depth={0}
          maxStringLength={maxStringLength}
          initialExpanded={initialExpanded}
        />
      </div>
    </div>
  );
};

export default JsonViewer;
