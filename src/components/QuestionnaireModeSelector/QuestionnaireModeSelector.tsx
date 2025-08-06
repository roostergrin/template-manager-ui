import React from 'react';
import { QuestionnaireMode } from '../../types/QuestionnaireStateTypes';
import './QuestionnaireModeSelector.sass';

interface QuestionnaireModeSelector {
  activeMode: QuestionnaireMode;
  onModeChange: (mode: QuestionnaireMode) => void;
}

const modes: Array<{ key: QuestionnaireMode; label: string; description: string }> = [
  {
    key: 'scrape',
    label: 'Scrape',
    description: 'Extract content from existing websites'
  },
  // {
  //   key: 'questionnaire',
  //   label: 'Questionnaire Form',
  //   description: 'Fill out structured questionnaire'
  // },
  {
    key: 'template-markdown',
    label: 'Template Questionnaire Markdown',
    description: 'Paste markdown template content'
  },
  {
    key: 'content-document',
    label: 'Content Document',
    description: 'Paste content document markdown'
  }
];

const QuestionnaireModeSelector: React.FC<QuestionnaireModeSelector> = ({
  activeMode,
  onModeChange
}) => {
  const handleModeClick = (mode: QuestionnaireMode) => {
    onModeChange(mode);
  };

  const handleKeyDown = (event: React.KeyboardEvent, mode: QuestionnaireMode) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleModeClick(mode);
    }
  };

  return (
    <div className="questionnaire-mode-selector">
      <h2 className="questionnaire-mode-selector__title">Select Input Method</h2>
      <div className="questionnaire-mode-selector__options">
        {modes.map((mode) => (
          <button
            key={mode.key}
            type="button"
            className={`questionnaire-mode-selector__option ${
              activeMode === mode.key ? 'questionnaire-mode-selector__option--active' : ''
            }`}
            onClick={() => handleModeClick(mode.key)}
            onKeyDown={(event) => handleKeyDown(event, mode.key)}
            aria-label={`Select ${mode.label} mode: ${mode.description}`}
            tabIndex={0}
          >
            <span className="questionnaire-mode-selector__option-label">{mode.label}</span>
            <span className="questionnaire-mode-selector__option-description">{mode.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuestionnaireModeSelector; 