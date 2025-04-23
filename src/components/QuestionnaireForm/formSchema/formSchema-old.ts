export const formSchema = [
  {
    key: 'practiceBasics',
    title: 'Practice Basics',
    fields: [
      {
        name: 'practiceName',
        label: 'Practice Name',
        type: 'text',
        required: true,
        placeholder: 'e.g., Gordon Orthodontics',
        helpText: 'Official name shown on your site',
      },
      {
        name: 'orthodontistName',
        label: 'Lead Orthodontist',
        type: 'text',
        placeholder: 'e.g., Dr. Gordon Lewis, DDS, MS',
      },
      {
        name: 'practiceTagline',
        label: 'Practice Tagline',
        type: 'text',
        placeholder: 'In one sentence, describe your practice’s mission',
        helpText: 'This appears in your homepage hero section',
      },
      {
        name: 'uniqueValue',
        label: 'Top 3 Differentiators',
        type: 'checkbox',
        options: [
          'Advanced Invisalign® technology',
          'Flexible evening/weekend hours',
          'Bilingual English/Spanish staff',
          'Complimentary consultations',
          'Warm, coffee-bar waiting area',
          'Other (explain below)'
        ],
      },
      {
        name: 'uniqueExplainer',
        label: 'Tell us why each matters',
        type: 'textarea',
        dependsOn: 'uniqueValue',
        visibleWhen: (vals) => Array.isArray(vals.uniqueValue) && vals.uniqueValue.length > 0,
        helpText: 'E.g., “Evening hours help working parents book easily.”',
      },
    ],
  },
  {
    key: 'toneSettings',
    title: 'Tone & Audience',
    fields: [
      {
        name: 'primaryAudience',
        label: 'Primary Audience',
        type: 'text',
        placeholder: 'e.g., Families with kids',
      },
      {
        name: 'secondaryAudience',
        label: 'Secondary Audience',
        type: 'text',
        placeholder: 'e.g., Adult professionals',
      },
      {
        name: 'brandAdjectives',
        label: 'Pick 3 Brand Adjectives',
        type: 'checkbox',
        options: [
          'Approachable', 'Modern', 'Trustworthy',
          'Playful', 'High-tech', 'Calm', 'Friendly'
        ],
        helpText: 'Choose adjectives that match how you want patients to feel',
      },
      {
        name: 'writingStyle',
        label: 'Writing Style',
        type: 'radio',
        options: ['Conversational', 'Professional', 'Playful', 'Inspirational'],
        helpText: 'Select the tone for your website copy',
      },
    ],
  },
  {
    key: 'contactDetails',
    title: 'Contact & Location',
    fields: [
      {
        name: 'phone',
        label: 'Office Phone',
        type: 'tel',
        placeholder: '(123) 456-7890',
      },
      {
        name: 'email',
        label: 'Contact Email',
        type: 'email',
        placeholder: 'info@yourpractice.com',
      },
      {
        name: 'address',
        label: 'Street Address',
        type: 'text',
        placeholder: '1520 Duvall Ave NE',
      },
      {
        name: 'cityState',
        label: 'City / State / ZIP',
        type: 'text',
        placeholder: 'Renton, WA 98059',
      },
      {
        name: 'businessHours',
        label: 'Office Hours',
        type: 'textarea',
        helpText: 'E.g., Mon–Fri 9 AM–5 PM; Sat 9 AM–1 PM',
      },
      {
        name: 'specialNotes',
        label: 'Amenities & Notes',
        type: 'textarea',
        placeholder: 'e.g., Coffee bar, wheelchair accessible, free Wi-Fi',
      },
    ],
  },
  {
    key: 'brandVisuals',
    title: 'Brand & Visuals',
    fields: [
      {
        name: 'brandColor',
        label: 'Primary Color',
        type: 'color',
        helpText: 'Hex code (e.g., #1A6FA0)',
      },
      {
        name: 'accentColor',
        label: 'Accent Color',
        type: 'color',
      },
      {
        name: 'logoUrl',
        label: 'Logo URL',
        type: 'text',
        helpText: 'Vector (.ai/.eps) or high-res PNG',
      },
      {
        name: 'fontChoices',
        label: 'Preferred Fonts',
        type: 'textarea',
        placeholder: 'Headings: Archivo; Body: Open Sans',
      },
    ],
  },
  {
    key: 'aboutSection',
    title: 'About & Story',
    fields: [
      {
        name: 'doctorBio',
        label: 'Doctor Biography',
        type: 'textarea',
        placeholder: 'Share 2-3 sentences about your background',
      },
      {
        name: 'doctorPhotoUrl',
        label: 'Doctor Photo',
        type: 'text',
        helpText: 'Headshot, square crop (400×400px)',
      },
      {
        name: 'teamOverview',
        label: 'Team Overview',
        type: 'textarea',
        helpText: 'List names and roles, one per line',
      },
      {
        name: 'communityEngagement',
        label: 'Community Involvement',
        type: 'textarea',
        placeholder: 'School fairs, sponsorships, volunteer work…',
      },
    ],
  },
  {
    key: 'treatments',
    title: 'Treatments & Services',
    fields: [
      {
        name: 'treatmentsOffered',
        label: 'Select Treatments You Offer',
        type: 'checkbox',
        options: [
          'Early Treatment (Phase I)',
          'Adult Treatment',
          'Braces (metal/clear)',
          'Invisalign®',
          'Orthognathic Surgery',
          'Retainers',
          'Digital 3D Scan'
        ],
      },
      {
        name: 'treatmentDetails',
        label: 'Treatment Highlights',
        type: 'textarea',
        dependsOn: 'treatmentsOffered',
        visibleWhen: (vals) => Array.isArray(vals.treatmentsOffered) && vals.treatmentsOffered.length,
        helpText: 'One line summary of each selected treatment',
      },
    ],
  },
  {
    key: 'patientInfo',
    title: 'Get Started',
    fields: [
      {
        name: 'financialOptions',
        label: 'Financing & Insurance',
        type: 'textarea',
        placeholder: 'Accepted plans, payment options…',
      },
      {
        name: 'hasPatientForms',
        label: 'Do You Offer Online Forms?',
        type: 'radio',
        options: ['Yes', 'No'],
      },
      {
        name: 'formsUrl',
        label: 'Online Forms URLs',
        type: 'textarea',
        dependsOn: 'hasPatientForms',
        visibleWhen: (vals) => vals.hasPatientForms === 'Yes',
      }
    ],
  },
];
