import React from 'react';
import { Search, CheckCircle, Map, Palette, Rocket, Check } from 'lucide-react';
import './StickyProgressNav.sass';

interface NavStep {
  id: string;
  label: string;
  icon: string;
}

interface StickyProgressNavProps {
  steps: NavStep[];
  activeStep: string;
  onStepClick: (stepId: string) => void;
}

const iconMap: { [key: string]: React.ComponentType<{ size?: number }> } = {
  Search,
  CheckCircle,
  Map,
  Palette,
  Rocket,
};

const StickyProgressNav: React.FC<StickyProgressNavProps> = ({ steps, activeStep, onStepClick }) => {
  return (
    <nav className="sticky-progress-nav">
      <div className="sticky-progress-nav__steps">
        {steps.map((step, index) => {
          const isActive = step.id === activeStep;
          const activeIndex = steps.findIndex(s => s.id === activeStep);
          const isCompleted = index < activeIndex;
          const IconComponent = iconMap[step.icon];

          return (
            <button
              key={step.id}
              className={`sticky-progress-nav__step ${isActive ? 'sticky-progress-nav__step--active' : ''} ${isCompleted ? 'sticky-progress-nav__step--completed' : ''}`}
              onClick={() => onStepClick(step.id)}
              aria-label={`Go to ${step.label}`}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="sticky-progress-nav__step-icon">
                {isCompleted ? <Check size={18} /> : IconComponent && <IconComponent size={18} />}
              </span>
              <span className="sticky-progress-nav__step-label">{step.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default StickyProgressNav;
