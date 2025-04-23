import React, { useState } from "react";
import Form from "@rjsf/core";
import validator from '@rjsf/validator-ajv8';
import { schema } from './schema';
import { mockScrape } from './mockScrape';

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
    <>
      <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} />
      <button type="button" onClick={() => mockScrapeDomain(domain)}>
        Load Defaults
      </button>
      <Form
        schema={schema}
        formData={formData}
        onChange={(e) => setFormData(e.formData)}
        validator={validator}
      >
        <div>
          <button type='submit'>Submit</button>
          <button type='button'>Cancel</button>
        </div>
      </Form>
    </>
  );
} 