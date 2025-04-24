const mockScrapeData = {
  practiceBasics: {
    practiceName: 'Gordon Orthodontics',
    orthodontistName: 'Dr. Gordon Lewis, DDS, MS',
    practiceTagline: 'Creating confident smiles for all ages',
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