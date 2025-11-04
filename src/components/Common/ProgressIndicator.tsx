import React from 'react';
import { Circle, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { ProgressStatus } from '../../hooks/useProgressTracking';

interface ProgressIndicatorProps {
  status: ProgressStatus;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  status,
  size = 'medium',
  showLabel = false,
  className = '',
}) => {
  const getStatusIcon = (status: ProgressStatus) => {
    const iconSize = size === 'small' ? 14 : size === 'large' ? 24 : 18;
    
    switch (status) {
      case 'pending':
        return <Circle size={iconSize} />;
      case 'in-progress':
        return <Loader2 size={iconSize} className="progress-indicator__spinner" />;
      case 'completed':
        return <CheckCircle2 size={iconSize} />;
      case 'error':
        return <XCircle size={iconSize} />;
      default:
        return <Circle size={iconSize} />;
    }
  };

  const getStatusLabel = (status: ProgressStatus): string => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      default:
        return 'Pending';
    }
  };

  const getStatusColor = (status: ProgressStatus): string => {
    switch (status) {
      case 'pending':
        return '#6c757d';
      case 'in-progress':
        return '#0d6efd';
      case 'completed':
        return '#198754';
      case 'error':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getSizeClass = (size: string): string => {
    switch (size) {
      case 'small':
        return 'progress-indicator--small';
      case 'large':
        return 'progress-indicator--large';
      default:
        return 'progress-indicator--medium';
    }
  };

  return (
    <div 
      className={`progress-indicator ${getSizeClass(size)} progress-indicator--${status} ${className}`}
      style={{ color: getStatusColor(status) }}
      title={getStatusLabel(status)}
    >
      <span className="progress-indicator__icon">
        {getStatusIcon(status)}
      </span>
      {showLabel && (
        <span className="progress-indicator__label">
          {getStatusLabel(status)}
        </span>
      )}
    </div>
  );
};

export default ProgressIndicator;