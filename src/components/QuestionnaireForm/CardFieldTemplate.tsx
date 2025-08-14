import React from "react";
import '../../components/QuestionnaireForm/QuestionnaireForm.sass';

// This type is a minimal approximation for RJSF field template props
// You can expand it as needed for stricter typing
interface CardFieldTemplateProps {
  id?: string;
  label?: string;
  help?: React.ReactNode;
  required?: boolean;
  description?: React.ReactNode;
  errors?: React.ReactNode;
  children?: React.ReactNode;
  schema: { type?: string };
  uiSchema?: any;
  rawErrors?: string[];
  // RJSF array field props
  items?: any[];
  onAddClick?: (event: any) => void;
}

export const CardFieldTemplate = (props: CardFieldTemplateProps) => {
  const {
    id, label, help, required, description, errors, children, schema, items, onAddClick
  } = props;

  // Array field: show children and add button
  if (schema.type === "array") {
    return (
      <div className="questionnaire-form__array">
        {label && (
          <h3 className="questionnaire-form__section-title">{label}</h3>
        )}
        {description && (
          <div className="questionnaire-form__description">{description}</div>
        )}
        {items && items.map((element) => (
          <div key={element.key} className="questionnaire-form__array-item">
            {element.children}
            {element.hasRemove && (
              <button type="button" className="questionnaire-form__input" onClick={element.onDropIndexClick(element.index)}>- Remove</button>
            )}
          </div>
        ))}
        {onAddClick && (
          <button type="button" className="questionnaire-form__input" onClick={onAddClick}>+ Add</button>
        )}
      </div>
    );
  }

  // Only show card for object fields (sections)
  if (schema.type === "object") {
    return (
      <div className="questionnaire-form__card">
        {label && (
          <h2 className="questionnaire-form__section-title">
            {label}
          </h2>
        )}
        {description && (
          <div className="questionnaire-form__description">{description}</div>
        )}
        {children}
        <div className="questionnaire-form__divider" />
      </div>
    );
  }

  // For regular fields
  return (
    <div className="questionnaire-form__field">
      {label && (
        <label className="questionnaire-form__label" htmlFor={id}>
          {label}
          {required ? <span className="questionnaire-form__required">*</span> : null}
        </label>
      )}
      {description && (
        <div className="questionnaire-form__description">{description}</div>
      )}
      {children}
      {help}
      {errors}
    </div>
  );
}; 