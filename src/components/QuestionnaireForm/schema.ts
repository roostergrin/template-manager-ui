import { RJSFSchema } from '@rjsf/utils';

export const schema: RJSFSchema = {
  title: "Questionnaire",
  type: "object",
  required: ["name"],
  properties: {
    name: { type: "string", title: "Name" },
    age: { type: "number", title: "Age" },
  },
};
