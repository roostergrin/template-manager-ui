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
          type: "string",
          title: "Top Differentiators"
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
      title: "Contact & Locations",
      description: "How patients can reach or visit your practice.",
      properties: {
        locations: {
          type: "array",
          title: "Locations",
          items: {
            type: "object",
            properties: {
              phone: { type: "string", title: "Office Phone" },
              email: { type: "string", title: "Contact Email", format: "email" },
              address: { type: "string", title: "Street Address" },
              cityState: { type: "string", title: "City / State / ZIP" },
              businessHours: { type: "string", title: "Office Hours" },
              specialNotes: { type: "string", title: "Amenities & Notes" }
            }
          }
        }
      }
    },
    aboutSection: {
      type: "object",
      title: "About & Story",
      description: "Share your background, team, and community involvement.",
      properties: {
        doctorBio: { type: "string", title: "Doctor Biography" },
        doctorPhotoUrl: { type: "string", title: "Doctor Photo" },
        teamOverview: {
          type: "array",
          title: "Team Members",
          items: {
            type: "object",
            properties: {
              image: { type: "string", title: "Photo URL" },
              name: { type: "string", title: "Name" },
              title: { type: "string", title: "Title/Role" },
            },
            required: ["name", "title"]
          }
        },
        communityEngagement: { type: "string", title: "Community Involvement" }
      }
    },
    brand: {
      type: "object",
      title: "Brand Assets",
      properties: {
        brandColor: { type: "string", title: "Brand Color", format: "color" },
        accentColor: { type: "string", title: "Accent Color", format: "color" },
        headingFont: { type: "string", title: "Heading Font" },
        bodyFont: { type: "string", title: "Body Font" },
        instagram: { type: "string", title: "Instagram" },
        googleReviewLink: { type: "string", title: "Google Review Link" },
        missionStatement: { type: "string", title: "Mission Statement" },
        communityInvolvement: { type: "string", title: "Community Involvement" },
        logoUpload: { type: "string", title: "Logo URL" },
        collateralUpload: { type: "string", title: "Collateral URL" }
      }
    },
    photos: {
      type: "object",
      title: "Photos",
      properties: {
        officeGallery: {
          type: "array",
          title: "Office Gallery",
          items: { type: "string", title: "Photo URL", format: "uri" }
        },
        beforeAfterGallery: {
          type: "array",
          title: "Before & After Gallery",
          items: {
            type: "object",
            properties: {
              beforeUrl: { type: "string", title: "Before Photo URL", format: "uri" },
              afterUrl: { type: "string", title: "After Photo URL", format: "uri" }
            },
            required: ["beforeUrl", "afterUrl"]
          }
        }
      }
    },
    treatments: {
      type: "object",
      title: "Treatments Offered",
      properties: {
        treatmentsOffered: { type: "string", title: "Treatments Offered" },
        topTreatments: { type: "string", title: "Top Treatments" },
        topicsToAvoid: { type: "string", title: "Topics to Avoid" }
      }
    },
    patientInfo: {
      type: "object",
      title: "Get Started / Patient Info",
      properties: {
        financialOptions: { type: "string", title: "Financial Options" },
        hasPatientForms: { type: "string", title: "Has Patient Forms?", enum: ["yes", "no"] },
        patientFormUrls: { type: "string", title: "Patient Forms" },
        formsUrl: { type: "string", title: "Forms URL" }
      }
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
      "ui:widget": "textarea",
      "ui:placeholder": "Describe what makes your practice unique (e.g., technology, hours, staff, amenities, etc.)",
      "ui:classNames": "questionnaire-form__textarea"
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
      "locations"
    ],
    locations: {
      "ui:options": {
        addButtonText: "Add Location"
      },
      items: {
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
      "ui:classNames": "questionnaire-form__array"
    }
  },
  aboutSection: {
    "ui:order": [
      "doctorBio",
      "doctorPhotoUrl",
      "teamOverview",
      "communityEngagement"
    ],
    doctorBio: {
      "ui:widget": "textarea",
      "ui:placeholder": "Share 2-3 sentences about your background",
      "ui:classNames": "questionnaire-form__textarea"
    },
    doctorPhotoUrl: {
      "ui:placeholder": "",
      "ui:help": "Headshot, square crop (400×400px)",
      "ui:classNames": "questionnaire-form__input"
    },
    teamOverview: {
      "ui:options": {
        addButtonText: "Add Team Member"
      },
      "items": {
        name: {
          "ui:placeholder": "e.g., Sarah Lee",
          "ui:classNames": "questionnaire-form__input"
        },
        title: {
          "ui:placeholder": "e.g., Office Manager",
          "ui:classNames": "questionnaire-form__input"
        },
        image: {
          "ui:placeholder": "Image URL (optional)",
          "ui:help": "Square crop recommended",
          "ui:classNames": "questionnaire-form__input"
        }
      },
      "ui:help": "Add each team member's name, title, and (optionally) photo.",
      "ui:classNames": "questionnaire-form__array"
    },
    communityEngagement: {
      "ui:widget": "textarea",
      "ui:placeholder": "School fairs, sponsorships, volunteer work…",
      "ui:classNames": "questionnaire-form__textarea"
    }
  },
  practiceContactBasics: {
    "ui:order": [
      "practiceName",
      "orthodontistName",
      "phone",
      "email",
      "address",
      "suite",
      "cityState",
      "googleMapsLink",
      "businessHours",
      "specialNotes"
    ],
    practiceName: { "ui:placeholder": "Practice Name", "ui:classNames": "questionnaire-form__input" },
    orthodontistName: { "ui:placeholder": "Orthodontist Name", "ui:classNames": "questionnaire-form__input" },
    phone: { "ui:placeholder": "Phone", "ui:classNames": "questionnaire-form__input" },
    email: { "ui:placeholder": "Email", "ui:classNames": "questionnaire-form__input" },
    address: { "ui:placeholder": "Address", "ui:classNames": "questionnaire-form__input" },
    suite: { "ui:placeholder": "Suite", "ui:classNames": "questionnaire-form__input" },
    cityState: { "ui:placeholder": "City/State", "ui:classNames": "questionnaire-form__input" },
    googleMapsLink: { "ui:placeholder": "Google Maps Link", "ui:classNames": "questionnaire-form__input" },
    businessHours: { "ui:placeholder": "Business Hours", "ui:classNames": "questionnaire-form__input" },
    specialNotes: { "ui:widget": "textarea", "ui:placeholder": "Special Notes", "ui:classNames": "questionnaire-form__textarea" }
  },
  brand: {
    "ui:order": [
      "brandColor",
      "accentColor",
      "headingFont",
      "bodyFont",
      "instagram",
      "googleReviewLink",
      "missionStatement",
      "communityInvolvement",
      "logoUpload",
      "collateralUpload"
    ],
    brandColor: { "ui:widget": "color", "ui:classNames": "questionnaire-form__input" },
    accentColor: { "ui:widget": "color", "ui:classNames": "questionnaire-form__input" },
    headingFont: { "ui:placeholder": "Heading Font", "ui:classNames": "questionnaire-form__input" },
    bodyFont: { "ui:placeholder": "Body Font", "ui:classNames": "questionnaire-form__input" },
    instagram: { "ui:placeholder": "Instagram", "ui:classNames": "questionnaire-form__input" },
    googleReviewLink: { "ui:placeholder": "Google Review Link", "ui:classNames": "questionnaire-form__input" },
    missionStatement: { "ui:widget": "textarea", "ui:placeholder": "Mission Statement", "ui:classNames": "questionnaire-form__textarea" },
    communityInvolvement: { "ui:widget": "textarea", "ui:placeholder": "Community Involvement", "ui:classNames": "questionnaire-form__textarea" },
    logoUpload: { "ui:placeholder": "Logo image URL", "ui:help": "Paste a direct link to your logo image (e.g., https://...)" , "ui:classNames": "questionnaire-form__input" },
    collateralUpload: { "ui:placeholder": "Collateral file URL", "ui:help": "Paste a direct link to your collateral file (e.g., PDF, image)", "ui:classNames": "questionnaire-form__input" }
  },
  photos: {
    "ui:order": [
      "officeGallery",
      "beforeAfterGallery"
    ],
    officeGallery: {
      "ui:options": { addButtonText: "Add Photo" },
      "ui:help": "Add URLs of office photos (e.g., https://...)" ,
      items: {
        "ui:placeholder": "Photo URL",
        "ui:classNames": "questionnaire-form__input"
      },
      "ui:classNames": "questionnaire-form__array"
    },
    beforeAfterGallery: {
      "ui:options": { addButtonText: "Add Before & After Pair" },
      "ui:help": "Add before and after photo URL pairs.",
      items: {
        beforeUrl: {
          "ui:placeholder": "Before Photo URL",
          "ui:classNames": "questionnaire-form__input"
        },
        afterUrl: {
          "ui:placeholder": "After Photo URL",
          "ui:classNames": "questionnaire-form__input"
        }
      },
      "ui:classNames": "questionnaire-form__array"
    }
  },
  about: {
    "ui:order": [
      "teamMembers",
      "doctorBio",
      "doctorPhoto",
      "doctorPhilosophy",
      "topReasons",
      "patientExperience",
      "testimonials",
      "communityEngagement"
    ],
    teamMembers: { "ui:widget": "textarea", "ui:placeholder": "Team Members", "ui:classNames": "questionnaire-form__textarea" },
    doctorBio: { "ui:widget": "textarea", "ui:placeholder": "Doctor Bio", "ui:classNames": "questionnaire-form__textarea" },
    doctorPhoto: { "ui:widget": "file", "ui:classNames": "questionnaire-form__input" },
    doctorPhilosophy: { "ui:widget": "textarea", "ui:placeholder": "Doctor Philosophy", "ui:classNames": "questionnaire-form__textarea" },
    topReasons: { "ui:widget": "textarea", "ui:placeholder": "Top Reasons to Choose Us", "ui:classNames": "questionnaire-form__textarea" },
    patientExperience: { "ui:widget": "textarea", "ui:placeholder": "Patient Experience", "ui:classNames": "questionnaire-form__textarea" },
    testimonials: { "ui:widget": "textarea", "ui:placeholder": "Current Testimonials", "ui:classNames": "questionnaire-form__textarea" },
    communityEngagement: { "ui:widget": "textarea", "ui:placeholder": "Community Engagement", "ui:classNames": "questionnaire-form__textarea" }
  },
  treatments: {
    "ui:order": [
      "treatmentsOffered",
      "topTreatments",
      "topicsToAvoid"
    ],
    treatmentsOffered: { "ui:widget": "textarea", "ui:placeholder": "Treatments Offered", "ui:classNames": "questionnaire-form__textarea" },
    topTreatments: { "ui:widget": "textarea", "ui:placeholder": "Top Treatments", "ui:classNames": "questionnaire-form__textarea" },
    topicsToAvoid: { "ui:widget": "textarea", "ui:placeholder": "Topics to Avoid", "ui:classNames": "questionnaire-form__textarea" }
  },
  patientInfo: {
    "ui:order": [
      "financialOptions",
      "hasPatientForms",
      "patientFormUrls",
      "formsUrl"
    ],
    financialOptions: { "ui:widget": "textarea", "ui:placeholder": "Financial Options", "ui:classNames": "questionnaire-form__textarea" },
    hasPatientForms: { "ui:widget": "radio", "ui:options": { "inline": true }, "ui:classNames": "questionnaire-form__radio-group" },
    patientFormUrls: { "ui:widget": "textarea", "ui:placeholder": "Patient Forms", "ui:classNames": "questionnaire-form__textarea" },
    formsUrl: { "ui:placeholder": "Forms URL", "ui:classNames": "questionnaire-form__input" }
  },
};