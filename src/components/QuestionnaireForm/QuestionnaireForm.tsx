import React, { useState, useEffect } from "react";
import Form from "@rjsf/core";
import validator from '@rjsf/validator-ajv8';
import { schema, uiSchema } from './schema';
import { mockScrape } from './mockScrape';
import './QuestionnaireForm.sass';
import { ArrayFieldTemplateProps } from '@rjsf/utils';
import useFillForm from '../../hooks/useFillForm';
import DomainScrapeOptions from './DomainScrapeOptions';

export default function QuestionnaireForm({
  formData,
  setFormData,
}: {
  formData: { name: string; age: number };
  setFormData: React.Dispatch<React.SetStateAction<{ name: string; age: number }>>;
}) {
  const [domain, setDomain] = useState('');

  const [fillFormData, fillFormStatus, triggerFillForm] = useFillForm();

  useEffect(() => {
    if (fillFormStatus === 'success' && fillFormData?.questionnaire_data) {
      setFormData(fillFormData.questionnaire_data as any);
    }
  }, [fillFormStatus, fillFormData, setFormData]);

  const mockScrapeDomain = async (domain: string) => {
    const scrapedData = await mockScrape(domain);
    setFormData(scrapedData);
  };

  const handleFillForm = (scrape: boolean, useSelenium: boolean, scroll: boolean) => {
    triggerFillForm({
      scrape,
      domain,
      use_selenium: useSelenium,
      scroll,
    });
  };

  function ArrayFieldTemplate(props: ArrayFieldTemplateProps) {
    return (
      <div>
        {props.items.map((element) => element.children)}
        {props.canAdd && <button type='button' onClick={props.onAddClick}>Add</button>}
      </div>
    );
  }

  return (
    <div className="questionnaire-form flex flex-col gap-6">
      <h1 className="questionnaire-form__form-title text-2xl font-bold mb-4">{schema.title}</h1>

      <pre> {JSON.stringify(fillFormStatus, null, 2)} </pre>
      <pre> {JSON.stringify(fillFormData, null, 2)} </pre>
      <DomainScrapeOptions
        domain={domain}
        setDomain={setDomain}
        handleFillForm={handleFillForm}
        fillFormStatus={fillFormStatus}
        fillFormData={fillFormData}
        mockScrapeDomain={mockScrapeDomain}
      />

      <Form
        schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        onChange={(e) => setFormData(e.formData)}
        validator={validator}
        templates={{ ArrayFieldTemplate }}
      >
      </Form>
    </div>
  );
} 