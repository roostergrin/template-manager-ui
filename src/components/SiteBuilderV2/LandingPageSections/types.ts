// Landing Page JSON Data Types

export interface ImageData {
  webp?: string;
  jpg?: string;
  alt: string;
}

export interface HeroData {
  image?: ImageData;
  tagline: string;
  secondary_tagline?: string;
  button: string;
}

export interface LogoData {
  format: string;
  icon: string;
  alt: string;
}

export interface BannerData {
  logos: LogoData[];
}

export interface ImageTextItem {
  image?: ImageData;
  title: string;
  body: string;
}

export interface ImageTextData {
  title?: string;
  sections: ImageTextItem[];
}

export interface FormData {
  tagline: string;
  background_icon?: string;
}

export interface ContactInfo {
  href: string;
  label: string;
}

export interface GlobalData {
  logo: string;
  title: string;
  email: ContactInfo;
  address: ContactInfo;
  phone: ContactInfo;
}

export interface FooterData {
  copyright: {
    label: string;
  };
}

export interface SEOData {
  title: string;
  description: string;
  gtmId?: string;
  favicon?: string;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  header: string;
  text: string;
  button: string;
  hover: string;
  background: string;
  footer: string;
  heroText: string;
}

export interface ThemeData {
  colors: ThemeColors;
}

export interface CCRecipient {
  recipient: string;
}

export interface FormSettingsData {
  subject: string;
  sender: string;
  recipient: string;
  cc: CCRecipient[];
  optIn: {
    message: string;
  };
}

export interface LandingPageData {
  home: {
    hero?: HeroData;
    banner?: BannerData;
    image_text?: ImageTextData;
    form?: FormData;
  };
  form: FormSettingsData;
  'global-data': GlobalData;
  'the-footer': FooterData;
  seo: SEOData;
  theme: ThemeData;
}

export type ComponentEditMode = 
  | { type: 'global' }
  | { type: 'hero'; sectionId: string }
  | { type: 'logos'; sectionId: string }
  | { type: 'image-text'; sectionId: string }
  | { type: 'contact'; sectionId: string }
  | { type: 'footer'; sectionId: string };

