export interface SitemapItem {
  model: string;
  query: string;
  id: string;
}

export interface SitemapSection {
  id: string;
  title: string;
  items: SitemapItem[];
  wordpress_id?: string;
}

export interface QuestionnaireData {
  // Section A
  practiceDetails: string;
  siteVision: string;
  primaryAudience: string;
  secondaryAudience: string;
  demographics: string;
  uniqueQualities: string;
  
  // Section B
  contentCreation: 'new' | 'prior';
  hasBlog: boolean;
  blogType: string;
  topTreatments: string;
  writingStyle: string;
  topicsToAvoid: string;
  communityEngagement: string;
  testimonials: string;
  patientExperience: string;
  financialOptions: string;
} 