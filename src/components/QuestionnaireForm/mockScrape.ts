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