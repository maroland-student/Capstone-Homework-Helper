// Jest setup file
// Add any global test setup here

// Mock expo modules if needed
jest.mock('expo-file-system', () => ({
  Paths: {
    cache: {
      createFile: jest.fn(),
    },
    info: jest.fn(),
  },
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'test',
  },
  Alert: {
    alert: jest.fn(),
  },
}));

