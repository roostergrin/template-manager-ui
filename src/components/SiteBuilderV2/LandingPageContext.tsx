import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LandingPageData, ComponentEditMode } from './LandingPageSections/types';

interface LandingPageContextType {
  data: LandingPageData;
  updateData: (path: string, value: any) => void;
  editMode: ComponentEditMode;
  setEditMode: (mode: ComponentEditMode) => void;
}

const defaultData: LandingPageData = {
  home: {
    hero: {
      tagline: 'New site coming soon!',
      secondary_tagline: 'Dr. Somebody Somebody',
      image: {
        jpg: 'https://d2sy0v7xyp1zo0.cloudfront.net/landing-bg-3.jpg',
        webp: 'https://d2sy0v7xyp1zo0.cloudfront.net/landing-bg-3.webp',
        alt: 'Smiling Woman'
      },
      button: 'Contact Us',
    },
    banner: {
      logos: [
        { format: 'svg', icon: 'aao', alt: 'AAO' },
        { format: 'svg', icon: 'abo', alt: 'ABO' },
        { format: 'svg', icon: 'invisalign', alt: 'Invisalign' },
        { format: 'svg', icon: 'invisalign-teen', alt: 'Invisalign Teen' },
      ],
    },
    image_text: {
      title: 'Why Choose Our Practice?',
      sections: [
        {
          image: {
            webp: 'https://d2sy0v7xyp1zo0.cloudfront.net/landing-image-placeholder.webp',
            jpg: 'https://d2sy0v7xyp1zo0.cloudfront.net/landing-image-placeholder.jpg',
            alt: 'Advanced dental technology equipment',
          },
          title: 'Meet The Doctor',
          body: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br><br>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        },
      ],
    },
    form: {
      tagline: "We'd love to hear from you!",
      background_icon: 'dot',
    },
  },
  form: {
    subject: 'New Contact Form Submission',
    sender: 'no-reply@example.com',
    recipient: 'contact@example.com',
    cc: [],
    optIn: {
      message: 'By providing your phone number, you agree to receive text messages from Example Orthodontics. Message and data rates may apply. Message frequency varies. Reply STOP to opt-out.',
    },
  },
  'global-data': {
    logo: '',
    title: 'Example Orthodontics',
    email: {
      href: 'mailto:contact@example.com',
      label: 'contact@example.com',
    },
    address: {
      href: 'https://the-googs.com',
      label: '5432 Address<br>St, 00000',
    },
    phone: {
      href: 'tel:+15555555555',
      label: '555.555.5555',
    },
  },
  'the-footer': {
    copyright: {
      label: '© 2025 Example Orthodontics. All Rights Reserved.',
    },
  },
  seo: {
    title: 'Example Orthodontics',
    description: 'Professional orthodontic care',
    gtmId: 'GTM-XXXXXXX',
  },
  theme: {
    colors: {
      primary: '#002247',
      secondary: '#b7c7cd',
      header: '#002247',
      text: '#979797',
      button: '#56d3d2',
      hover: '#979797',
      background: '#f8f8f8',
      footer: '#002247',
      heroText: '#000000',
    },
  },
};

const LandingPageContext = createContext<LandingPageContextType | undefined>(undefined);

export const LandingPageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<LandingPageData>(defaultData);
  const [editMode, setEditMode] = useState<ComponentEditMode>({ type: 'global' });

  const updateData = (path: string, value: any) => {
    setData((prevData) => {
      const newData = { ...prevData };
      const keys = path.split('.');
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  return (
    <LandingPageContext.Provider value={{ data, updateData, editMode, setEditMode }}>
      {children}
    </LandingPageContext.Provider>
  );
};

export const useLandingPage = () => {
  const context = useContext(LandingPageContext);
  if (!context) {
    throw new Error('useLandingPage must be used within LandingPageProvider');
  }
  return context;
};

