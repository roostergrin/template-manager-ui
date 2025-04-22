import React from 'react';

interface FormActionsProps {
  onReset: () => void;
}

const FormActions: React.FC<FormActionsProps> = ({ onReset }) => (
  <div className="form-actions">
    <button type="button" className="reset-button" onClick={onReset}>Reset Form</button>
  </div>
);

export default FormActions; 