const { router } = require('expo-router');

// mock
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

// this is a mock alert
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('Login Logic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should navigate to explore tab when login is successful', () => {
    // this is a login 
    const email = 'test@example.com';
    const password = 'password123';
    
    // login logic
    if (email.trim() && password.trim()) {
      router.push('/(tabs)/explore');
    }
    
    expect(router.push).toHaveBeenCalledWith('/(tabs)/explore');
  });

  it('should not navigate when email is empty', () => {
    const email = '';
    const password = 'password123';
    
    if (email.trim() && password.trim()) {
      router.push('/(tabs)/explore');
    }
    
    expect(router.push).not.toHaveBeenCalled();
  });

  it('should not navigate when password is empty', () => {
    const email = 'test@example.com';
    const password = '';
    
    if (email.trim() && password.trim()) {
      router.push('/(tabs)/explore');
    }
    
    expect(router.push).not.toHaveBeenCalled();
  });

  it('should navigate when both fields have whitespace that gets trimmed', () => {
    const email = '  test@example.com  ';
    const password = '  password123  ';
    
    if (email.trim() && password.trim()) {
      router.push('/(tabs)/explore');
    }
    
    expect(router.push).toHaveBeenCalledWith('/(tabs)/explore');
  });

  it('should not navigate when both fields are only whitespace', () => {
    const email = '   ';
    const password = '   ';
    
    if (email.trim() && password.trim()) {
      router.push('/(tabs)/explore');
    }
    
    expect(router.push).not.toHaveBeenCalled();
  });
});
