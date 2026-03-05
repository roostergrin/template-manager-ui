import React from 'react';
import { List, Zap, Upload } from 'lucide-react';
import { WorkflowMode } from '../../types/UnifiedWorkflowTypes';

interface ModeOption {
  id: WorkflowMode;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  {
    id: 'manual',
    label: 'Manual',
    description: 'Step-by-step control',
    icon: <List size={20} />,
    color: '#16a34a',
    bgColor: 'rgba(22, 163, 74, 0.08)',
  },
  {
    id: 'yolo',
    label: 'YOLO',
    description: 'Automated execution',
    icon: <Zap size={20} />,
    color: '#d97706',
    bgColor: 'rgba(217, 119, 6, 0.08)',
  },
  {
    id: 'batch',
    label: 'Batch',
    description: 'Process multiple sites',
    icon: <Upload size={20} />,
    color: '#7c3aed',
    bgColor: 'rgba(124, 58, 237, 0.08)',
  },
];

interface ModeSelectorProps {
  mode: WorkflowMode;
  isRunning: boolean;
  onModeChange: (mode: WorkflowMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, isRunning, onModeChange }) => (
  <div className="mode-selector">
    {MODE_OPTIONS.map((option) => (
      <button
        key={option.id}
        type="button"
        className={`mode-selector__pill ${mode === option.id ? 'mode-selector__pill--active' : ''}`}
        onClick={() => onModeChange(option.id)}
        disabled={isRunning}
        aria-label={`Select ${option.label} mode: ${option.description}`}
        style={mode === option.id ? { '--pill-color': option.color, '--pill-bg': option.bgColor } as React.CSSProperties : undefined}
      >
        <span className="mode-selector__icon">{option.icon}</span>
        <span className="mode-selector__label">{option.label}</span>
      </button>
    ))}
  </div>
);

export default ModeSelector;
