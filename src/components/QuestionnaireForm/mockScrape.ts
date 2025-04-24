const mockScrapeData = {
  practiceBasics: {
    practiceName: 'Rooster Grin Dental',
    orthodontistName: 'Dr. Jamie Chen, DDS',
    practiceTagline: 'Brightening smiles, one grin at a time',
    uniqueValue: [
      'Advanced Invisalign® technology',
      'Flexible evening/weekend hours',
      'Bilingual English/Spanish staff'
    ],
    uniqueExplainer: 'Evening hours help working parents book easily. Bilingual staff ensures everyone feels welcome.'
  },
  toneSettings: {
    primaryAudience: 'Families with kids',
    secondaryAudience: 'Adult professionals',
    brandAdjectives: ['Approachable', 'Modern', 'Trustworthy'],
    writingStyle: 'Conversational'
  },
  contactDetails: {
    phone: '(425) 555-1234',
    email: 'info@roostergrindental.com',
    address: '1520 Duvall Ave NE',
    cityState: 'Renton, WA 98059',
    businessHours: 'Mon–Fri 9 AM–5 PM; Sat 9 AM–1 PM',
    specialNotes: 'Coffee bar, wheelchair accessible, free Wi-Fi'
  },
  aboutSection: {
    doctorBio: 'Lorem ipsum dolor sit amet...',
    doctorPhotoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Default-Icon.jpg',
    teamOverview: [
      { name: 'Lorem Ipsum', title: 'Office Manager', image: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Default-Icon.jpg' },
      { name: 'Dolor Sit', title: 'Dental Assistant', image: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Default-Icon.jpg' },
      { name: 'Amet Consectetur', title: 'Treatment Coordinator', image: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Default-Icon.jpg' }
    ],
    communityEngagement: 'Participates in lorem ipsum community events and supports local initiatives.'
  }
  // Add more sections as you expand your schema
};

export async function mockScrape(domain: string) {
  // Simulate an API call delay
  console.log('mockScrape', domain);
  return new Promise<typeof mockScrapeData>((resolve) =>
    setTimeout(() => resolve(mockScrapeData), 500)
  );
} 