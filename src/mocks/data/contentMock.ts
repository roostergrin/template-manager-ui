// Mock data for Content generation step
// Matches the structure returned by the real /generate-content/ endpoint
// pageData is keyed by page name, each containing sections keyed by internal_id
import { ContentStepResult } from '../../types/UnifiedWorkflowTypes';

// Helper to generate a mock image URL
const mockImage = (category: string, index: number) =>
  `https://ik.imagekit.io/roostergrin/stock/${category}/${category}-${index}.jpg`;

export const createMockContentResult = (domain: string): ContentStepResult => {
  const practiceName = domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return {
    success: true,
    pagesGenerated: 6,
    // Global data - shared across all pages
    globalData: {
      site_settings: {
        practice_name: practiceName,
        phone: '(555) 123-4567',
        email: `info@${domain}`,
        address: {
          street: '123 Main Street',
          city: 'San Francisco',
          state: 'CA',
          zip: '94102',
        },
      },
      navigation: {
        main: [
          { label: 'Home', path: '/' },
          { label: 'About', path: '/about' },
          { label: 'Treatments', path: '/treatments' },
          { label: 'Get Started', path: '/get-started' },
          { label: 'Contact', path: '/contact' },
        ],
        footer: [
          { label: 'Privacy Policy', path: '/privacy' },
          { label: 'FAQ', path: '/faq' },
        ],
      },
      social_links: {
        facebook: `https://facebook.com/${domain.replace('.', '')}`,
        instagram: `https://instagram.com/${domain.replace('.', '')}`,
        twitter: `https://x.com/${domain.replace('.', '')}`,
        linkedin: `https://linkedin.com/company/${domain.replace('.', '')}`,
        youtube: `https://youtube.com/@${domain.replace('.', '')}`,
        tiktok: `https://tiktok.com/@${domain.replace('.', '')}`,
        yelp: `https://yelp.com/biz/${domain.replace('.', '')}`,
        google_review: `https://g.page/${domain.replace('.', '')}/review`,
      },
      hours: [
        { day: 'Monday', hours: '9:00 AM - 5:00 PM' },
        { day: 'Tuesday', hours: '9:00 AM - 5:00 PM' },
        { day: 'Wednesday', hours: '9:00 AM - 5:00 PM' },
        { day: 'Thursday', hours: '9:00 AM - 5:00 PM' },
        { day: 'Friday', hours: '9:00 AM - 4:00 PM' },
        { day: 'Saturday', hours: 'Closed' },
        { day: 'Sunday', hours: 'Closed' },
      ],
    },
    // Page data - keyed by page name, each containing sections keyed by internal_id
    pageData: {
      'Home': {
        page_id: '8',
        internal_id: 'page-home-8',
        sections: {
          'section-1-hero': {
            model: 'Hero',
            data: {
              headline: `Welcome to ${practiceName}`,
              subheadline: 'Creating Beautiful Smiles for the Whole Family',
              cta_text: 'Schedule Your Free Consultation',
              cta_link: '/get-started',
              background_image: mockImage('hero', 1),
            },
          },
          'section-2-block-text-fh': {
            model: 'Block Text Fh',
            data: {
              title: 'Your Trusted Orthodontic Partner',
              content: `At ${practiceName}, we believe everyone deserves a confident smile. Our team of experienced orthodontists uses the latest technology to provide personalized treatment plans for patients of all ages.`,
            },
          },
          'section-3-multi-item-row': {
            model: 'Multi Item Row',
            data: {
              items: [
                { title: 'Expert Care', description: 'Board-certified orthodontists with years of experience', icon: 'award' },
                { title: 'Latest Technology', description: 'State-of-the-art equipment for precise treatment', icon: 'settings' },
                { title: 'Flexible Financing', description: 'Payment plans to fit your budget', icon: 'credit-card' },
              ],
            },
          },
          'section-4-image-text': {
            model: 'Image Text',
            data: {
              title: 'Meet Dr. Smith',
              content: 'Dr. Smith is a board-certified orthodontist who has been transforming smiles for over 15 years. She graduated with honors from dental school and completed her orthodontic residency at a top program.',
              image: mockImage('doctor', 1),
              image_alt: 'Dr. Smith, Lead Orthodontist',
              preserve_image: true,
            },
          },
          'section-5-block-masonary-grid': {
            model: 'Block Masonary Grid',
            data: {
              title: 'Our Treatments',
              items: [
                { title: 'Traditional Braces', description: 'Classic metal braces for effective treatment', image: mockImage('braces', 1), link: '/treatments/braces' },
                { title: 'Invisalign', description: 'Clear aligners for a virtually invisible option', image: mockImage('invisalign', 1), link: '/treatments/invisalign' },
                { title: 'Early Treatment', description: 'Phase 1 orthodontics for growing children', image: mockImage('kids', 1), link: '/treatments/early-treatment' },
                { title: 'Adult Orthodontics', description: 'Never too late for a great smile', image: mockImage('adult', 1), link: '/treatments/adult' },
              ],
            },
          },
          'section-6-multi-item-testimonial': {
            model: 'Multi Item Testimonial',
            data: {
              title: 'What Our Patients Say',
              testimonials: [
                { quote: 'The team made my entire experience comfortable and stress-free. I love my new smile!', author: 'Sarah M.', rating: 5 },
                { quote: 'Dr. Smith is amazing. She explained everything clearly and the results exceeded my expectations.', author: 'John D.', rating: 5 },
                { quote: 'Best orthodontic experience ever. The staff is friendly and professional.', author: 'Emily R.', rating: 5 },
              ],
            },
          },
          'section-7-multi-use-banner': {
            model: 'Multi Use Banner',
            data: {
              title: 'Ready to Start Your Smile Journey?',
              content: 'Schedule your free consultation today and take the first step toward your perfect smile.',
              cta_text: 'Book Now',
              cta_link: '/get-started',
              background_color: 'primary',
            },
          },
        },
      },
      'About': {
        page_id: '186',
        internal_id: 'page-about-186',
        sections: {
          'section-hero-about': {
            model: 'Hero',
            data: {
              headline: 'About Us',
              subheadline: `Learn more about ${practiceName} and our commitment to excellence`,
              background_image: mockImage('office', 1),
            },
          },
          'section-block-text-mission': {
            model: 'Block Text Simple',
            data: {
              title: 'Our Mission',
              content: 'To provide exceptional orthodontic care in a warm, welcoming environment while achieving beautiful, lasting results for every patient.',
            },
          },
          'section-tabs-doctor': {
            model: 'Tabs',
            data: {
              title: 'Meet Your Doctor',
              tabs: [
                {
                  label: 'Dr. Smith',
                  content: 'Dr. Smith is a board-certified orthodontist with over 15 years of experience.',
                  image: mockImage('doctor', 1),
                  preserve_image: true,
                },
              ],
            },
          },
          'section-block-grid-team': {
            model: 'Block Grid',
            data: {
              title: 'Our Team',
              items: [
                { name: 'Jessica', role: 'Treatment Coordinator', image: mockImage('team', 1), preserve_image: true },
                { name: 'Michael', role: 'Dental Assistant', image: mockImage('team', 2), preserve_image: true },
                { name: 'Lisa', role: 'Office Manager', image: mockImage('team', 3), preserve_image: true },
              ],
            },
          },
          'section-slider-office': {
            model: 'Single Image Slider',
            data: {
              title: 'Our Office',
              images: [
                { src: mockImage('office', 1), alt: 'Reception area' },
                { src: mockImage('office', 2), alt: 'Treatment room' },
                { src: mockImage('office', 3), alt: 'Waiting area' },
              ],
            },
          },
          'section-banner-about': {
            model: 'Multi Use Banner',
            data: {
              title: 'Join Our Family',
              cta_text: 'Schedule a Visit',
              cta_link: '/get-started',
            },
          },
        },
      },
      'Treatments': {
        page_id: '264',
        internal_id: 'page-treatments-264',
        sections: {
          'section-hero-treatments': {
            model: 'Hero',
            data: {
              headline: 'Our Treatments',
              subheadline: 'Comprehensive orthodontic solutions for every smile',
              background_image: mockImage('hero', 2),
            },
          },
          'section-image-text-early': {
            model: 'Image Text',
            data: {
              title: 'Early Treatment',
              content: 'Phase 1 orthodontic treatment can address developing problems early, potentially reducing the need for more extensive treatment later.',
              image: mockImage('kids', 1),
            },
          },
          'section-image-text-adult': {
            model: 'Image Text',
            data: {
              title: 'Adult Orthodontics',
              content: "It's never too late to achieve the smile you've always wanted. We offer discreet options for adult patients.",
              image: mockImage('adult', 1),
            },
          },
          'section-image-text-braces': {
            model: 'Image Text',
            data: {
              title: 'Traditional Braces',
              content: 'Metal and ceramic braces remain the most effective treatment for complex orthodontic cases.',
              image: mockImage('braces', 1),
            },
          },
          'section-image-text-invisalign': {
            model: 'Image Text',
            data: {
              title: 'Invisalign',
              content: 'Clear aligners offer a virtually invisible way to straighten your teeth without metal brackets or wires.',
              image: mockImage('invisalign', 1),
            },
          },
          'section-banner-treatments': {
            model: 'Multi Use Banner',
            data: {
              title: 'Find Your Perfect Treatment',
              cta_text: 'Free Consultation',
              cta_link: '/get-started',
            },
          },
        },
      },
      'Get Started': {
        page_id: '266',
        internal_id: 'page-get-started-266',
        sections: {
          'section-hero-get-started': {
            model: 'Hero',
            data: {
              headline: 'Get Started',
              subheadline: 'Begin your journey to a beautiful smile',
              background_image: mockImage('hero', 3),
            },
          },
          'section-image-text-first-visit': {
            model: 'Image Text',
            data: {
              title: 'Your First Visit',
              content: 'Your initial consultation includes a comprehensive exam, digital X-rays, and a personalized treatment plan discussion.',
              image: mockImage('office', 2),
            },
          },
          'section-block-text-finance': {
            model: 'Block Text Simple',
            data: {
              title: 'Insurance & Financing',
              content: 'We accept most major insurance plans and offer flexible payment options to make treatment affordable for everyone.',
            },
          },
          'section-image-text-forms': {
            model: 'Image Text',
            data: {
              title: 'Patient Forms',
              content: 'Save time by downloading and completing your patient forms before your first visit.',
              cta_text: 'Download Forms',
              cta_link: '/forms/patient-intake.pdf',
            },
          },
          'section-banner-get-started': {
            model: 'Multi Use Banner',
            data: {
              title: 'Ready to Begin?',
              cta_text: 'Schedule Now',
              cta_link: '/contact',
            },
          },
        },
      },
      'Contact': {
        page_id: '268',
        internal_id: 'page-contact-268',
        sections: {
          'section-hero-contact': {
            model: 'Hero',
            data: {
              headline: 'Contact Us',
              subheadline: "We'd love to hear from you",
            },
          },
          'section-map-contact': {
            model: 'Map',
            data: {
              address: '123 Main Street, San Francisco, CA 94102',
              coordinates: { lat: 37.7749, lng: -122.4194 },
            },
          },
          'section-form-contact': {
            model: 'Form',
            data: {
              title: 'Send Us a Message',
              fields: [
                { name: 'name', label: 'Full Name', type: 'text', required: true },
                { name: 'email', label: 'Email', type: 'email', required: true },
                { name: 'phone', label: 'Phone', type: 'tel', required: false },
                { name: 'message', label: 'Message', type: 'textarea', required: true },
              ],
              submit_text: 'Send Message',
            },
          },
        },
      },
      'FAQ': {
        page_id: '850',
        internal_id: 'page-faq-850',
        sections: {
          'section-hero-faq': {
            model: 'Hero',
            data: {
              headline: 'Frequently Asked Questions',
              subheadline: 'Find answers to common questions about orthodontic treatment',
            },
          },
          'section-accordions-faq': {
            model: 'Accordions',
            data: {
              items: [
                { question: 'How long does orthodontic treatment take?', answer: 'Treatment time varies depending on the complexity of your case, but most treatments take between 12-24 months.' },
                { question: 'Does getting braces hurt?', answer: 'You may experience some discomfort after adjustments, but this typically subsides within a few days.' },
                { question: 'How often will I need to come in for appointments?', answer: 'Most patients visit every 4-8 weeks for adjustments and progress checks.' },
                { question: 'Can adults get braces?', answer: "Absolutely! It's never too late to achieve a beautiful smile. We offer several discreet options for adult patients." },
              ],
            },
          },
          'section-banner-faq': {
            model: 'Multi Use Banner',
            data: {
              title: 'Still Have Questions?',
              cta_text: 'Contact Us',
              cta_link: '/contact',
            },
          },
        },
      },
    },
  };
};
