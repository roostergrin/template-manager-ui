// Mock Mode Configuration and Context

export const MOCK_MODE_STORAGE_KEY = 'unified-workflow-mock-mode';

export interface MockModeConfig {
  enabled: boolean;
  responseDelay: number; // Simulated network delay in ms
}

const DEFAULT_CONFIG: MockModeConfig = {
  enabled: false,
  responseDelay: 500,
};

// Get mock config from localStorage
export const getMockConfig = (): MockModeConfig => {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;

  const saved = localStorage.getItem(MOCK_MODE_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return DEFAULT_CONFIG;
    }
  }
  return DEFAULT_CONFIG;
};

// Save mock config to localStorage
export const setMockConfig = (config: Partial<MockModeConfig>): MockModeConfig => {
  const current = getMockConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(MOCK_MODE_STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

// Check if mock mode is enabled
export const isMockModeEnabled = (): boolean => {
  return getMockConfig().enabled;
};

// Toggle mock mode
export const toggleMockMode = (enabled?: boolean): boolean => {
  const config = getMockConfig();
  const newEnabled = enabled !== undefined ? enabled : !config.enabled;
  setMockConfig({ enabled: newEnabled });
  return newEnabled;
};

// Set response delay
export const setMockResponseDelay = (delay: number): void => {
  setMockConfig({ responseDelay: delay });
};
