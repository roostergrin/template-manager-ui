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
  // Progress calculation: sections with at least one field filled
  const totalSections = formSchema.length;
  const completedSections = formSchema.filter(section => {
    const sectionValues = formData[section.key] || {};
    return section.fields.some(field => {
      const val = sectionValues[field.name];
      return val !== undefined && val !== '' && !(Array.isArray(val) && val.length === 0);
    });
  }).length;
  const percent = Math.round((completedSections / totalSections) * 100);

  return (
    <form className="dynamic-questionnaire-form" onSubmit={handleSubmit}>
      {/* Progress Indicator */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ width: '100%', marginBottom: 8 }}>
          <div style={{ fontSize: 14, marginBottom: 4 }}>
            Progress: {completedSections} / {totalSections} sections completed
          </div>
          <div style={{ background: '#eee', borderRadius: 4, height: 8, width: '100%' }}>
            <div
              style={{
                width: `${percent}%`,
                background: '#1A6FA0',
                height: '100%',
                borderRadius: 4,
                transition: 'width 0.3s'
              }}
            />
          </div>
        </div>
      </div>
      {formSchema.map(section => (
        <fieldset key={section.key} style={{ marginBottom: 32 }}>
          <legend style={{ fontWeight: 'bold', fontSize: 18 }}>{section.title}</legend>
          {section.fields.map(field => {
            // Get the current values for this section
            const sectionValues = formData[section.key] || {};

            // Determine if the field should be visible
            let isVisible = true;
            if (typeof field.visibleWhen === 'function') {
              isVisible = field.visibleWhen(sectionValues);
            }

            if (!isVisible) return null;

            const value = sectionValues[field.name] ?? '';
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
                    {field.helpText && (
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{field.helpText}</div>
                    )}
                  </div>
                );
              case 'checkbox':
                // Render multiple checkboxes for options array
                if (Array.isArray(field.options)) {
                  return (
                    <div key={fieldId} style={{ marginBottom: 16 }}>
                      <div style={{ fontWeight: 500 }}>{field.label}</div>
                      {field.options.map((option: string) => (
                        <label key={option} style={{ display: 'block', marginLeft: 8 }}>
                          <input
                            type="checkbox"
                            checked={Array.isArray(value) ? value.includes(option) : false}
                            onChange={e => {
                              let newValue = Array.isArray(value) ? [...value] : [];
                              if (e.target.checked) {
                                newValue.push(option);
                              } else {
                                newValue = newValue.filter((v: string) => v !== option);
                              }
                              handleChange(section.key, field.name, newValue);
                            }}
                          />
                          {option}
                        </label>
                      ))}
                      {field.helpText && (
                        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{field.helpText}</div>
                      )}
                    </div>
                  );
                }
                // Fallback for boolean checkbox
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
                    {field.helpText && (
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{field.helpText}</div>
                    )}
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
                    {field.helpText && (
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{field.helpText}</div>
                    )}
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
                    {field.helpText && (
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{field.helpText}</div>
                    )}
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
                    {field.helpText && (
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{field.helpText}</div>
                    )}
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