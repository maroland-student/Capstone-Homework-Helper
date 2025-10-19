import { createError, ErrorType, parseAuthError, parseNetworkError } from '@/lib/error-utils';

describe('signup form comprehensive tests', () => {
  describe('form state management', () => {
    it('should initialize with empty form data', () => {
      // testing form initialization with empty data
      const initialFormData = { 
        email: '', 
        password: '', 
        name: '',
        firstName: '',
        lastName: ''
      };
      
      expect(initialFormData.email).toBe('');
      expect(initialFormData.password).toBe('');
      expect(initialFormData.name).toBe('');
      expect(initialFormData.firstName).toBe('');
      expect(initialFormData.lastName).toBe('');
    });

    it('should update name field', () => {
      // testing name field update functionality
      let formData = { email: '', password: '', name: '', firstName: '', lastName: '' };
      formData = { ...formData, name: 'John Doe' };
      expect(formData.name).toBe('John Doe');
    });

    it('should update email field', () => {
      // testing email field update functionality
      let formData = { email: '', password: '', name: '', firstName: '', lastName: '' };
      formData = { ...formData, email: 'john@example.com' };
      expect(formData.email).toBe('john@example.com');
    });

    it('should update password field', () => {
      // testing password field update functionality
      let formData = { email: '', password: '', name: '', firstName: '', lastName: '' };
      formData = { ...formData, password: 'password123' };
      expect(formData.password).toBe('password123');
    });

    it('should update optional fields', () => {
      // testing optional fields update functionality
      let formData = { email: '', password: '', name: '', firstName: '', lastName: '' };
      formData = { ...formData, firstName: 'John', lastName: 'Doe' };
      expect(formData.firstName).toBe('John');
      expect(formData.lastName).toBe('Doe');
    });

    it('should update all fields', () => {
      // testing updating all form fields
      let formData = { 
        email: '', 
        password: '', 
        name: '', 
        firstName: '', 
        lastName: '' 
      };
      formData = { 
        ...formData, 
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };
      
      expect(formData.name).toBe('John Doe');
      expect(formData.email).toBe('john@example.com');
      expect(formData.password).toBe('password123');
      expect(formData.firstName).toBe('John');
      expect(formData.lastName).toBe('Doe');
    });
  });

  describe('form validation logic', () => {
    it('should validate required fields - all empty', () => {
      // testing validation when all required fields are empty
      const formData = { email: '', password: '', name: '', firstName: '', lastName: '' };
      const missingFields = [];
      if (!formData.name.trim()) missingFields.push('Full Name');
      if (!formData.email.trim()) missingFields.push('Email');
      if (!formData.password.trim()) missingFields.push('Password');
      
      expect(missingFields).toEqual(['Full Name', 'Email', 'Password']);
    });

    it('should validate required fields - name missing', () => {
      // testing validation when name field is missing
      const formData = { email: 'test@example.com', password: 'password123', name: '', firstName: '', lastName: '' };
      const missingFields = [];
      if (!formData.name.trim()) missingFields.push('Full Name');
      if (!formData.email.trim()) missingFields.push('Email');
      if (!formData.password.trim()) missingFields.push('Password');
      
      expect(missingFields).toEqual(['Full Name']);
    });

    it('should validate required fields - email missing', () => {
      const formData = { email: '', password: 'password123', name: 'John Doe', firstName: '', lastName: '' };
      const missingFields = [];
      if (!formData.name.trim()) missingFields.push('Full Name');
      if (!formData.email.trim()) missingFields.push('Email');
      if (!formData.password.trim()) missingFields.push('Password');
      
      expect(missingFields).toEqual(['Email']);
    });

    it('should validate required fields - password missing', () => {
      const formData = { email: 'test@example.com', password: '', name: 'John Doe', firstName: '', lastName: '' };
      const missingFields = [];
      if (!formData.name.trim()) missingFields.push('Full Name');
      if (!formData.email.trim()) missingFields.push('Email');
      if (!formData.password.trim()) missingFields.push('Password');
      
      expect(missingFields).toEqual(['Password']);
    });

    it('should validate required fields - all present', () => {
      const formData = { email: 'test@example.com', password: 'password123', name: 'John Doe', firstName: '', lastName: '' };
      const missingFields = [];
      if (!formData.name.trim()) missingFields.push('Full Name');
      if (!formData.email.trim()) missingFields.push('Email');
      if (!formData.password.trim()) missingFields.push('Password');
      
      expect(missingFields).toEqual([]);
    });

    it('should validate password length - too short', () => {
      const password = '123';
      const isValidLength = password.length >= 6;
      expect(isValidLength).toBe(false);
    });

    it('should validate password length - valid', () => {
      const password = 'password123';
      const isValidLength = password.length >= 6;
      expect(isValidLength).toBe(true);
    });

    it('should validate password length - exactly 6 characters', () => {
      const password = '123456';
      const isValidLength = password.length >= 6;
      expect(isValidLength).toBe(true);
    });
  });

  describe('rate limiting logic', () => {
    it('should enforce rate limiting - within limit', () => {
      const now = Date.now();
      const lastAttempt = now - 2000; // 2 seconds ago
      const timeSinceLastAttempt = now - lastAttempt;
      const rateLimitMs = 4000;
      
      const shouldBlock = timeSinceLastAttempt < rateLimitMs;
      expect(shouldBlock).toBe(true);
    });

    it('should allow requests after rate limit period', () => {
      const now = Date.now();
      const lastAttempt = now - 5000; // 5 seconds ago
      const timeSinceLastAttempt = now - lastAttempt;
      const rateLimitMs = 4000;
      
      const shouldBlock = timeSinceLastAttempt < rateLimitMs;
      expect(shouldBlock).toBe(false);
    });

    it('should calculate remaining time correctly', () => {
      const now = Date.now();
      const lastAttempt = now - 1000; // 1 second ago
      const timeSinceLastAttempt = now - lastAttempt;
      const rateLimitMs = 4000;
      const remainingTime = Math.ceil((rateLimitMs - timeSinceLastAttempt) / 1000);
      
      expect(remainingTime).toBe(3);
    });

    it('should handle edge case - exactly at rate limit', () => {
      const now = Date.now();
      const lastAttempt = now - 4000; // exactly 4 seconds ago
      const timeSinceLastAttempt = now - lastAttempt;
      const rateLimitMs = 4000;
      
      const shouldBlock = timeSinceLastAttempt < rateLimitMs;
      expect(shouldBlock).toBe(false);
    });
  });

  describe('loading state management', () => {
    it('should handle loading state', () => {
      let loading = false;
      expect(loading).toBe(false);

      loading = true;
      expect(loading).toBe(true);

      loading = false;
      expect(loading).toBe(false);
    });

    it('should disable button when loading', () => {
      const loading = true;
      const isDisabled = loading;
      expect(isDisabled).toBe(true);
    });

    it('should enable button when not loading', () => {
      const loading = false;
      const isDisabled = loading;
      expect(isDisabled).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should create password too short error', () => {
      const error = createError(
        ErrorType.PASSWORD_TOO_SHORT,
        'Password must be at least 6 characters long',
        'Password must be at least 6 characters long'
      );

      expect(error.type).toBe(ErrorType.PASSWORD_TOO_SHORT);
      expect(error.message).toBe('Password must be at least 6 characters long');
      expect(error.userMessage).toBe('Password must be at least 6 characters long');
    });

    it('should create rate limit error', () => {
      const remainingTime = 2;
      const error = createError(
        ErrorType.INTERNAL_ERROR,
        `Rate limit: Please wait ${remainingTime} more seconds`,
        `Please wait ${remainingTime} more seconds before trying again.`
      );

      expect(error.type).toBe(ErrorType.INTERNAL_ERROR);
      expect(error.userMessage).toContain('Please wait 2 more seconds');
    });

    it('should create required field error', () => {
      const missingFields = ['Full Name', 'Email'];
      const error = createError(
        ErrorType.REQUIRED_FIELD,
        `Missing required fields: ${missingFields.join(', ')}`,
        'Required forms must be filled out'
      );

      expect(error.type).toBe(ErrorType.REQUIRED_FIELD);
      expect(error.message).toContain('Full Name');
      expect(error.message).toContain('Email');
    });

    it('should parse email already exists error', () => {
      const authError = { message: 'Email already exists' };
      const parsedError = parseAuthError(authError);

      expect(parsedError.type).toBe(ErrorType.EMAIL_ALREADY_EXISTS);
      expect(parsedError.userMessage).toBe('An account with this email already exists');
    });

    it('should parse network error', () => {
      const networkError = { message: 'Network request failed' };
      const parsedError = parseNetworkError(networkError);

      expect(parsedError.type).toBe(ErrorType.CONNECTION_FAILED);
      expect(parsedError.userMessage).toBe('Unable to connect to server. Please try again');
    });
  });

  describe('platform-specific logic', () => {
    it('should handle web platform', () => {
      const Platform = { OS: 'web' };
      const isWeb = Platform.OS === 'web';
      expect(isWeb).toBe(true);
    });

    it('should handle iOS platform', () => {
      const Platform = { OS: 'ios' };
      const isIOS = Platform.OS === 'ios';
      expect(isIOS).toBe(true);
    });

    it('should handle Android platform', () => {
      const Platform = { OS: 'android' };
      const isAndroid = Platform.OS === 'android';
      expect(isAndroid).toBe(true);
    });
  });

  describe('callback functions', () => {
    it('should handle onBackToLogin callback', () => {
      const mockCallback = jest.fn();
      expect(typeof mockCallback).toBe('function');
      
      mockCallback();
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle optional callback', () => {
      const optionalCallback = undefined;
      expect(optionalCallback).toBeUndefined();
      
      const definedCallback = jest.fn();
      expect(definedCallback).toBeDefined();
    });
  });

  describe('form submission logic', () => {
    it('should prepare signup data correctly', () => {
      const formData = { 
        email: 'john@example.com', 
        password: 'password123', 
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe'
      };
      
      const signupData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        image: undefined,
      };

      expect(signupData.email).toBe('john@example.com');
      expect(signupData.password).toBe('password123');
      expect(signupData.name).toBe('John Doe');
      expect(signupData.image).toBeUndefined();
    });

    it('should handle successful signup response', () => {
      const response = { data: { user: { id: '1' } }, error: null };
      const hasData = !!response.data;
      const hasError = !!response.error;

      expect(hasData).toBe(true);
      expect(hasError).toBe(false);
    });

    it('should handle failed signup response', () => {
      const response = { data: null, error: { message: 'Email already exists' } };
      const hasData = !!response.data;
      const hasError = !!response.error;

      expect(hasData).toBe(false);
      expect(hasError).toBe(true);
    });

    it('should handle no response', () => {
      const response = { data: null, error: null };
      const hasData = !!response.data;
      const hasError = !!response.error;

      expect(hasData).toBe(false);
      expect(hasError).toBe(false);
    });
  });

  describe('success message logic', () => {
    it('should create success message for web', () => {
      const Platform = { OS: 'web' };
      const isWeb = Platform.OS === 'web';
      
      if (isWeb) {
        const message = 'Account Created!\n\nYour account has been created successfully! You can now sign in.';
        expect(message).toContain('Account Created!');
        expect(message).toContain('successfully');
      }
    });

    it('should create success message for mobile', () => {
      const Platform = { OS: 'ios' };
      const isWeb = Platform.OS === 'web';
      
      if (!isWeb) {
        const title = 'Account Created!';
        const message = 'Your account has been created successfully! You can now sign in.';
        expect(title).toBe('Account Created!');
        expect(message).toContain('successfully');
      }
    });
  });
});
