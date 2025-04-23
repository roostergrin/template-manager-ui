import { z } from 'zod';

export const QuestionnaireSchema = z.object({
  website: z.object({
    hasSite: z.boolean(),
    siteDomain: z.string().optional(),
    siteVision: z.string().optional(),
    uniqueQualities: z.string().optional(),
    websitesYouLove: z.string().optional(),
  }),
  contact: z.object({
    practiceName: z.string(),
    orthodontistName: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
    suite: z.string().optional(),
    cityState: z.string().optional(),
    googleMapsLink: z.string().optional(),
    businessHours: z.string().optional(),
    specialNotes: z.string().optional(),
  }),
  // Add other sections here as needed, following the same pattern
});

export type QuestionnaireData = z.infer<typeof QuestionnaireSchema>;
