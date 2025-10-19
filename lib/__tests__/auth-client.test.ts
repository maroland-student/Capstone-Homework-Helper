import { signIn, signUp } from '../auth-client';

describe('auth client', () => {

  it('should have signIn object defined', () => {
    // testing that signIn object is properly exported
    expect(signIn).toBeDefined();
    expect(typeof signIn).toBe('object');
  });

  it('should have signUp object defined', () => {
    // testing that signUp object is properly exported
    expect(signUp).toBeDefined();
    expect(typeof signUp).toBe('object');
  });

  it('should have signIn.email function', () => {
    // testing that signIn.email function is available
    expect(signIn.email).toBeDefined();
    expect(typeof signIn.email).toBe('function');
  });

  it('should have signUp.email function', () => {
    // testing that signUp.email function is available
    expect(signUp.email).toBeDefined();
    expect(typeof signUp.email).toBe('function');
  });

  it('should have signIn methods available', () => {
    // testing that signIn object has expected methods
    const methods = Object.keys(signIn);
    expect(methods).toContain('email');
  });

  it('should have signUp methods available', () => {
    // testing that signUp object has expected methods
    const methods = Object.keys(signUp);
    expect(methods).toContain('email');
  });

});
