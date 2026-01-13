// Mock data for Image Picker step
// Matches the structure returned by the real /replace-images/ endpoint
// Returns updated pageData with new image URLs from ImageKit
import { ImagePickerResult } from '../../types/UnifiedWorkflowTypes';

// Helper to generate ImageKit stock image URLs
const imagekitUrl = (category: string, index: number) =>
  `https://ik.imagekit.io/roostergrin/stock/${category}/stock-${category}-${index}-${Date.now()}.jpg`;

export const createMockImagePickerResult = (preserveDoctorPhotos: boolean): ImagePickerResult & { pageData: Record<string, unknown> } => {
  const preservedPhotos = preserveDoctorPhotos
    ? [
        'https://example.com/doctors/dr-smith.jpg',
        'https://example.com/doctors/dr-jones.jpg',
      ]
    : [];

  // Return updated page data with new image URLs
  // This is a simplified version - in reality, it would mirror the content structure
  return {
    success: true,
    imagesUpdated: 24,
    preservedDoctorPhotos: preservedPhotos,
    // The real endpoint returns the full pageData with updated image URLs
    pageData: {
      'Home': {
        page_id: '8',
        internal_id: 'page-home-8',
        sections: {
          'section-1-hero': {
            model: 'Hero',
            data: {
              headline: 'Welcome to Our Practice',
              subheadline: 'Creating Beautiful Smiles for the Whole Family',
              cta_text: 'Schedule Your Free Consultation',
              cta_link: '/get-started',
              background_image: imagekitUrl('hero', 1),
            },
          },
          'section-4-image-text': {
            model: 'Image Text',
            data: {
              title: 'Meet Dr. Smith',
              content: 'Dr. Smith is a board-certified orthodontist who has been transforming smiles for over 15 years.',
              // Preserved doctor photo - not replaced
              image: preserveDoctorPhotos
                ? 'https://example.com/doctors/dr-smith.jpg'
                : imagekitUrl('doctor', 1),
              image_alt: 'Dr. Smith, Lead Orthodontist',
              preserve_image: preserveDoctorPhotos,
            },
          },
          'section-5-block-masonary-grid': {
            model: 'Block Masonary Grid',
            data: {
              title: 'Our Treatments',
              items: [
                { title: 'Traditional Braces', description: 'Classic metal braces for effective treatment', image: imagekitUrl('braces', 1) },
                { title: 'Invisalign', description: 'Clear aligners for a virtually invisible option', image: imagekitUrl('invisalign', 1) },
                { title: 'Early Treatment', description: 'Phase 1 orthodontics for growing children', image: imagekitUrl('kids', 1) },
                { title: 'Adult Orthodontics', description: 'Never too late for a great smile', image: imagekitUrl('adult', 1) },
              ],
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
              background_image: imagekitUrl('office', 1),
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
                  image: preserveDoctorPhotos
                    ? 'https://example.com/doctors/dr-smith.jpg'
                    : imagekitUrl('doctor', 1),
                  preserve_image: preserveDoctorPhotos,
                },
              ],
            },
          },
          'section-block-grid-team': {
            model: 'Block Grid',
            data: {
              title: 'Our Team',
              items: [
                { name: 'Jessica', role: 'Treatment Coordinator', image: preserveDoctorPhotos ? 'https://example.com/team/jessica.jpg' : imagekitUrl('team', 1), preserve_image: preserveDoctorPhotos },
                { name: 'Michael', role: 'Dental Assistant', image: preserveDoctorPhotos ? 'https://example.com/team/michael.jpg' : imagekitUrl('team', 2), preserve_image: preserveDoctorPhotos },
                { name: 'Lisa', role: 'Office Manager', image: preserveDoctorPhotos ? 'https://example.com/team/lisa.jpg' : imagekitUrl('team', 3), preserve_image: preserveDoctorPhotos },
              ],
            },
          },
          'section-slider-office': {
            model: 'Single Image Slider',
            data: {
              title: 'Our Office',
              images: [
                { src: imagekitUrl('office', 1), alt: 'Reception area' },
                { src: imagekitUrl('office', 2), alt: 'Treatment room' },
                { src: imagekitUrl('office', 3), alt: 'Waiting area' },
              ],
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
              background_image: imagekitUrl('hero', 2),
            },
          },
          'section-image-text-early': {
            model: 'Image Text',
            data: {
              title: 'Early Treatment',
              image: imagekitUrl('kids', 2),
            },
          },
          'section-image-text-braces': {
            model: 'Image Text',
            data: {
              title: 'Traditional Braces',
              image: imagekitUrl('braces', 2),
            },
          },
          'section-image-text-invisalign': {
            model: 'Image Text',
            data: {
              title: 'Invisalign',
              image: imagekitUrl('invisalign', 2),
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
              background_image: imagekitUrl('hero', 3),
            },
          },
          'section-image-text-first-visit': {
            model: 'Image Text',
            data: {
              title: 'Your First Visit',
              image: imagekitUrl('office', 4),
            },
          },
        },
      },
      'Contact': {
        page_id: '268',
        internal_id: 'page-contact-268',
        sections: {},
      },
      'FAQ': {
        page_id: '850',
        internal_id: 'page-faq-850',
        sections: {},
      },
    },
  };
};
