const mockScrapeData = {
  name: 'Alice',
  age: 30,
}

export async function mockScrape(domain: string) {
  // Simulate an API call delay
  console.log('mockScrape', domain);
  return new Promise<{ name: string; age: number }>((resolve) =>
    setTimeout(() => resolve(mockScrapeData), 500)
  );
} 