import React from 'react';
import { formSchema } from './formSchema';

interface DynamicQuestionnaireFormProps {
  formData: any;
  handleChange: (section: string, field: string, value: any) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleReset: () => void;
  loading?: boolean;
  error?: string | null;
}

const DynamicQuestionnaireForm: React.FC<DynamicQuestionnaireFormProps> = ({
  formData,
  handleChange,
  handleSubmit,
  handleReset,
  loading,
  error,
}) => {
  return (
    <form className="dynamic-questionnaire-form" onSubmit={handleSubmit}>
      {formSchema.map(section => (
        <fieldset key={section.key} style={{ marginBottom: 32 }}>
          <legend style={{ fontWeight: 'bold', fontSize: 18 }}>{section.title}</legend>
          {section.fields.map(field => {
            const value = formData[section.key]?.[field.name] ?? '';
            const fieldId = `${section.key}-${field.name}`;
            switch (field.type) {
              case 'textarea':
                return (
                  <div key={fieldId} style={{ marginBottom: 16 }}>
                    <label htmlFor={fieldId}>{field.label}</label>
                    <textarea
                      id={fieldId}
                      name={field.name}
                      value={value}
                      onChange={e => handleChange(section.key, field.name, e.target.value)}
                      style={{ width: '100%', minHeight: 60 }}
                    />
                  </div>
                );
              case 'checkbox':
                return (
                  <div key={fieldId} style={{ marginBottom: 16 }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={!!value}
                        onChange={e => handleChange(section.key, field.name, e.target.checked)}
                      />
                      {field.label}
                    </label>
                  </div>
                );
              case 'radio':
                return (
                  <div key={fieldId} style={{ marginBottom: 16 }}>
                    <div>{field.label}</div>
                    {field.options?.map((option: string) => (
                      <label key={option} style={{ marginRight: 16 }}>
                        <input
                          type="radio"
                          name={fieldId}
                          value={option}
                          checked={value === option}
                          onChange={() => handleChange(section.key, field.name, option)}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                );
              case 'file':
                return (
                  <div key={fieldId} style={{ marginBottom: 16 }}>
                    <label htmlFor={fieldId}>{field.label}</label>
                    <input
                      id={fieldId}
                      type="file"
                      onChange={e => handleChange(section.key, field.name, e.target.files)}
                    />
                  </div>
                );
              default:
                return (
                  <div key={fieldId} style={{ marginBottom: 16 }}>
                    <label htmlFor={fieldId}>{field.label}</label>
                    <input
                      id={fieldId}
                      type={field.type}
                      name={field.name}
                      value={value}
                      onChange={e => handleChange(section.key, field.name, e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                );
            }
          })}
        </fieldset>
      ))}
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      {loading && <div style={{ color: 'gray', marginBottom: 16 }}>Loading...</div>}
      <div style={{ display: 'flex', gap: 16 }}>
        <button type="submit" disabled={loading}>Submit</button>
        <button type="button" onClick={handleReset} disabled={loading}>Reset</button>
      </div>
    </form>
  );
};

export default DynamicQuestionnaireForm; 