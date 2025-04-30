import React, { useState, useEffect } from "react";
import Form from "@rjsf/core";
import validator from '@rjsf/validator-ajv8';
import { schema, uiSchema } from './schema';
import { mockScrape } from './mockScrape';
import './QuestionnaireForm.sass';
import { ArrayFieldTemplateProps } from '@rjsf/utils';
import useFillForm from '../../hooks/useFillForm';
import DomainScrapeOptions from './DomainScrapeOptions';
import { FillFormResponse } from '../../services/fillForm';
import LoadingOverlay from '../LoadingOverlay';

// --- LocalStorage Utilities ---
const getFilledForm = (domain: string): FillFormResponse | null => {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(`filledForm:${domain}`);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to load filled form from localStorage', e);
    return null;
  }
};

const setFilledForm = (domain: string, data: FillFormResponse) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`filledForm:${domain}`, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save filled form to localStorage', e);
  }
};

// --- Helper to load cached form if available ---
const tryLoadCachedForm = (
  domain: string,
  setFormData: React.Dispatch<React.SetStateAction<FillFormResponse['questionnaire_data']>>
): boolean => {
  const cached = getFilledForm(domain);
  if (cached && cached.questionnaire_data) {
    setFormData(cached.questionnaire_data);
    return true;
  }
  return false;
};

export default function QuestionnaireForm({
  formData,
  setFormData,
}: {
  formData: FillFormResponse['questionnaire_data'];
  setFormData: React.Dispatch<React.SetStateAction<FillFormResponse['questionnaire_data']>>;
}) {
  const [domain, setDomain] = useState('');
  const [fillFormData, fillFormStatus, triggerFillForm] = useFillForm();

  // On successful fill, update form data and cache the entire fillFormData
  useEffect(() => {
    if (
      fillFormStatus === 'success' &&
      fillFormData?.questionnaire_data &&
      domain
    ) {
      setFormData(fillFormData.questionnaire_data);
      setFilledForm(domain, fillFormData);
    }
  }, [fillFormStatus, fillFormData, setFormData, domain]);

  // Try to load cached form, otherwise run fallback
  const handleWithCache = async (
    domain: string,
    fallback: () => void | Promise<void>
  ) => {
    if (!tryLoadCachedForm(domain, setFormData)) {
      await fallback();
    }
  };

  // Handler for mock scrape
  const mockScrapeDomain = (domain: string) => {
    handleWithCache(domain, async () => {
      const scrapedData = await mockScrape(domain);
      setFormData(scrapedData);
      // Optionally, you could also store this in localStorage if you want to persist mock data
    });
  };

  // Handler for real fill
  const handleFillForm = (scrape: boolean, useSelenium: boolean, scroll: boolean) => {
    handleWithCache(domain, () => {
      triggerFillForm({
        scrape,
        domain,
        use_selenium: useSelenium,
        scroll,
      });
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
    <div className="questionnaire-form flex flex-col gap-6 relative">
      {fillFormStatus === 'pending' && <LoadingOverlay />}
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