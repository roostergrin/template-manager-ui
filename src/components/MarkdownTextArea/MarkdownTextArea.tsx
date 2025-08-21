import React from 'react';
import './MarkdownTextArea.sass';

interface MarkdownTextAreaProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
}

const MarkdownTextArea: React.FC<MarkdownTextAreaProps> = ({
  title,
  value,
  onChange,
  placeholder = "Paste your markdown content here...",
  description
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow tab character in textarea
    if (event.key === 'Tab') {
      event.preventDefault();
      const textarea = event.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newValue = value.substring(0, start) + '\t' + value.substring(end);
      onChange(newValue);
      
      // Set cursor position after the tab
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    }
  };

  return (
    <div className="markdown-textarea">
      <div className="markdown-textarea__header">
        <h3 className="markdown-textarea__title">{title}</h3>
        {description && (
          <p className="markdown-textarea__description">{description}</p>
        )}
      </div>
      <div className="markdown-textarea__container">
        <textarea
          className="markdown-textarea__input"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={20}
          aria-label={title}
        />
        <div className="markdown-textarea__footer">
          <span className="markdown-textarea__char-count">
            {value.length} characters
          </span>
        </div>
      </div>
    </div>
  );
};

export default MarkdownTextArea; 
