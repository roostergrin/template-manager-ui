import React from "react";
import '../../components/QuestionnaireForm/QuestionnaireForm.sass';

type CardObjectFieldTemplateProps = {
  title?: string;
  description?: string;
  properties: { content: React.ReactNode }[];
};

export const CardObjectFieldTemplate = (props: CardObjectFieldTemplateProps) => {
  return (
    <div>
      {props.title && (
        <h2 className="questionnaire-form__section-title">
          {props.title}
        </h2>
      )}
      {props.description && (
        <div className="questionnaire-form__description">{props.description}</div>
      )}
      <div>{props.properties.map((prop) => prop.content)}</div>
      <div className="questionnaire-form__divider" />
    </div>
  );
}; 