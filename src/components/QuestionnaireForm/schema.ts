import { RJSFSchema } from '@rjsf/utils';

// --- Custom Field Template (for card layout) ---
// In your form renderer, pass this as the FieldTemplate prop to <Form />
// Example:
// import { Form } from '@rjsf/core';
// import { CardFieldTemplate } from './CardFieldTemplate';
// <Form schema={schema} uiSchema={uiSchema} FieldTemplate={CardFieldTemplate} ... />
//
// See https://rjsf-team.github.io/react-jsonschema-form/docs/advanced-customization/#custom-field-template

// JSON Schema for RJSF
export const schema: RJSFSchema = {
  type: "object",
  properties: {
    practiceBasics: {
      type: "object",
      title: "Practice Basics",
      description: "Tell us about your practice's core details. This information will appear on your homepage and contact sections.",
      properties: {
        practiceName: { type: "string", title: "Practice Name" },
        orthodontistName: { type: "string", title: "Lead Orthodontist" },
        practiceTagline: { type: "string", title: "Practice Tagline" },
        uniqueValue: {
          type: "array",
          title: "Top 3 Differentiators",
          items: {
            type: "string",
            enum: [
              "Advanced Invisalign® technology",
              "Flexible evening/weekend hours",
              "Bilingual English/Spanish staff",
              "Complimentary consultations",
              "Warm, coffee-bar waiting area",
              "Other (explain below)"
            ]
          },
          uniqueItems: true
        },
        uniqueExplainer: { type: "string", title: "Tell us why each matters" },
      },
      required: ["practiceName"]
    },
    toneSettings: {
      type: "object",
      title: "Tone & Audience",
      description: "Help us understand your brand's voice and who you want to reach.",
      properties: {
        primaryAudience: { type: "string", title: "Primary Audience" },
        secondaryAudience: { type: "string", title: "Secondary Audience" },
        brandAdjectives: {
          type: "array",
          title: "Pick 3 Brand Adjectives",
          items: {
            type: "string",
            enum: [
              "Approachable", "Modern", "Trustworthy",
              "Playful", "High-tech", "Calm", "Friendly"
            ]
          },
          uniqueItems: true
        },
        writingStyle: {
          type: "string",
          title: "Writing Style",
          enum: ["Conversational", "Professional", "Playful", "Inspirational"]
        },
      }
    },
    contactDetails: {
      type: "object",
      title: "Contact & Location",
      description: "How patients can reach or visit your practice.",
      properties: {
        phone: { type: "string", title: "Office Phone" },
        email: { type: "string", title: "Contact Email", format: "email" },
        address: { type: "string", title: "Street Address" },
        cityState: { type: "string", title: "City / State / ZIP" },
        businessHours: { type: "string", title: "Office Hours" },
        specialNotes: { type: "string", title: "Amenities & Notes" }
      },
    },
  },
  required: ["practiceBasics"],
  dependencies: {
    practiceBasics: {
      uniqueValue: {
        oneOf: [
          {
            properties: {
              practiceBasics: {
                uniqueValue: { minItems: 1 },
                uniqueExplainer: { type: "string" }
              }
            },
            required: ["uniqueExplainer"]
          },
          {
            properties: {
              practiceBasics: {
                uniqueValue: { maxItems: 0 }
              }
            }
          }
        ]
      }
    },
    toneSettings: {
      primaryAudience: {
        oneOf: [
          {
            properties: {
              primaryAudience: { type: "string" }
            }
          },
          {
            properties: {
              primaryAudience: { type: "string" }
            }
          }
        ]
      },
      secondaryAudience: {
        oneOf: [
          {
            properties: {
              secondaryAudience: { type: "string" }
            }
          },
          {
            properties: {
              secondaryAudience: { type: "string" }
            }
          }
        ]
      },
      brandAdjectives: {
        oneOf: [
          {
            properties: {
              brandAdjectives: {
                type: "array",
                items: {
                  type: "string",
                  enum: [
                    "Approachable", "Modern", "Trustworthy",
                    "Playful", "High-tech", "Calm", "Friendly"
                  ]
                },
                uniqueItems: true
              }
            }
          },
          {
            properties: {
              brandAdjectives: {
                type: "array",
                items: {
                  type: "string",
                  enum: [
                    "Approachable", "Modern", "Trustworthy",
                    "Playful", "High-tech", "Calm", "Friendly"
                  ]
                },
                uniqueItems: true
              }
            }
          }
        ]
      },
      writingStyle: {
        oneOf: [
          {
            properties: {
              writingStyle: {
                type: "string",
                enum: ["Conversational", "Professional", "Playful", "Inspirational"]
              }
            }
          },
          {
            properties: {
              writingStyle: {
                type: "string",
                enum: ["Conversational", "Professional", "Playful", "Inspirational"]
              }
            }
          }
        ]
      }
    },
  }
};

// UI Schema for RJSF (for placeholders, helpText, widget types)
export const uiSchema = {
  practiceBasics: {
    "ui:order": [
      "practiceName",
      "orthodontistName",
      "practiceTagline",
      "uniqueValue",
      "uniqueExplainer"
    ],
    "ui:description": "Tell us about your practice's core details. This information will appear on your homepage and contact sections.",
    practiceName: {
      "ui:placeholder": "e.g., Gordon Orthodontics",
      "ui:help": "Official name shown on your site",
      "ui:classNames": "questionnaire-form__input"
    },
    orthodontistName: {
      "ui:placeholder": "e.g., Dr. Gordon Lewis, DDS, MS",
      "ui:classNames": "questionnaire-form__input"
    },
    practiceTagline: {
      "ui:placeholder": "In one sentence, describe your practice's mission",
      "ui:help": "This appears in your homepage hero section",
      "ui:classNames": "questionnaire-form__input"
    },
    uniqueValue: {
      "ui:widget": "checkboxes",
      "ui:classNames": "questionnaire-form__checkbox-group"
    },
    uniqueExplainer: {
      "ui:widget": "textarea",
      "ui:help": "E.g., 'Evening hours help working parents book easily.'",
      "ui:classNames": "questionnaire-form__textarea"
    }
  },
  toneSettings: {
    "ui:order": [
      "primaryAudience",
      "secondaryAudience",
      "brandAdjectives",
      "writingStyle"
    ],
    "ui:description": "Help us understand your brand's voice and who you want to reach.",
    primaryAudience: {
      "ui:placeholder": "e.g., Families with kids",
      "ui:classNames": "questionnaire-form__input"
    },
    secondaryAudience: {
      "ui:placeholder": "e.g., Adult professionals",
      "ui:classNames": "questionnaire-form__input"
    },
    brandAdjectives: {
      "ui:widget": "checkboxes",
      "ui:help": "Choose adjectives that match how you want patients to feel",
      "ui:classNames": "questionnaire-form__checkbox-group"
    },
    writingStyle: {
      "ui:widget": "radio",
      "ui:help": "Select the tone for your website copy",
      "ui:classNames": "questionnaire-form__radio-group"
    }
  },
  contactDetails: {
    "ui:order": [
      "phone",
      "email",
      "address",
      "cityState",
      "businessHours",
      "specialNotes"
    ],
    phone: {
      "ui:placeholder": "(123) 456-7890",
      "ui:classNames": "questionnaire-form__input"
    },
    email: {
      "ui:placeholder": "info@yourpractice.com",
      "ui:classNames": "questionnaire-form__input"
    },
    address: {
      "ui:placeholder": "1520 Duvall Ave NE",
      "ui:classNames": "questionnaire-form__input"
    },
    cityState: {
      "ui:placeholder": "Renton, WA 98059",
      "ui:classNames": "questionnaire-form__input"
    },
    businessHours: {
      "ui:widget": "textarea",
      "ui:help": "E.g., Mon–Fri 9 AM–5 PM; Sat 9 AM–1 PM",
      "ui:classNames": "questionnaire-form__textarea"
    },
    specialNotes: {
      "ui:widget": "textarea",
      "ui:placeholder": "e.g., Coffee bar, wheelchair accessible, free Wi-Fi",
      "ui:classNames": "questionnaire-form__textarea"
    }
  },
};