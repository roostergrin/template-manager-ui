import React, { useState } from "react";
import Form from "@rjsf/core";
import validator from '@rjsf/validator-ajv8';
import { schema, uiSchema } from './schema';
import { mockScrape } from './mockScrape';
import './QuestionnaireForm.sass';

export default function QuestionnaireForm({
  formData,
  setFormData,
}: {
  formData: { name: string; age: number };
  setFormData: React.Dispatch<React.SetStateAction<{ name: string; age: number }>>;
}) {
  const [domain, setDomain] = useState('');

  const mockScrapeDomain = async (domain: string) => {
    const scrapedData = await mockScrape(domain);
    setFormData(scrapedData);
  };

  return (
    <div className="questionnaire-form">
      <h1 className="questionnaire-form__form-title">{schema.title}</h1>

      <div className="questionnaire-form__field">
        <input
          type="text"
          className="questionnaire-form__input"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="Enter a domain to load defaults"
        />
        <button
          type="button"
          className="questionnaire-form__input"
          onClick={() => mockScrapeDomain(domain)}
        >
          Load Defaults
        </button>
      </div>

      <Form
        schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        onChange={(e) => setFormData(e.formData)}
        validator={validator}
      >
      </Form>
    </div>
  );
} 