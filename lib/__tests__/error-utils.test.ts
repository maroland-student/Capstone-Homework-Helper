import {
    createError,
    ERROR_MESSAGES,
    ErrorType,
    parseAuthError,
    parseDatabaseError,
    parseNetworkError
} from '../error-utils';

describe('error utils', () => {
  describe('createError', () => {
    it('should create an error with all required properties', () => {
      // testing error creation with all properties
      const error = createError(
        ErrorType.INVALID_CREDENTIALS,
        'Test message',
        'User friendly message'
      );

      expect(error).toEqual({
        type: ErrorType.INVALID_CREDENTIALS,
        message: 'Test message',
        userMessage: 'User friendly message',
        details: undefined,
      });
    });

    it('should create an error with optional details', () => {
      // testing error creation with optional details parameter
      const details = { originalError: 'test' };
      const error = createError(
        ErrorType.NETWORK_ERROR,
        'Test message',
        'User friendly message',
        details
      );

      expect(error.details).toEqual(details);
    });
  });

  describe('parseAuthError', () => {
    it('should parse invalid credentials error', () => {
      // testing parsing of invalid credentials error messages
      const error = { message: 'Invalid credentials' };
      const result = parseAuthError(error);

      expect(result.type).toBe(ErrorType.INVALID_CREDENTIALS);
      expect(result.userMessage).toBe(ERROR_MESSAGES[ErrorType.INVALID_CREDENTIALS]);
    });

    it('should parse user not found error', () => {
      // testing parsing of user not found error messages
      const error = { message: 'User not found' };
      const result = parseAuthError(error);

      expect(result.type).toBe(ErrorType.USER_NOT_FOUND);
      expect(result.userMessage).toBe(ERROR_MESSAGES[ErrorType.USER_NOT_FOUND]);
    });

    it('should parse email already exists error', () => {
      // testing parsing of email already exists error messages
      const error = { message: 'Email already exists' };
      const result = parseAuthError(error);

      expect(result.type).toBe(ErrorType.EMAIL_ALREADY_EXISTS);
      expect(result.userMessage).toBe(ERROR_MESSAGES[ErrorType.EMAIL_ALREADY_EXISTS]);
    });

    it('should parse weak password error', () => {
      // testing parsing of weak password error messages
      const error = { message: 'Password too weak' };
      const result = parseAuthError(error);

      expect(result.type).toBe(ErrorType.WEAK_PASSWORD);
      expect(result.userMessage).toBe(ERROR_MESSAGES[ErrorType.WEAK_PASSWORD]);
    });

    it('should default to invalid credentials for unknown errors', () => {
      // testing default error handling for unknown auth errors
      const error = { message: 'Unknown error' };
      const result = parseAuthError(error);

      expect(result.type).toBe(ErrorType.INVALID_CREDENTIALS);
      expect(result.userMessage).toBe(ERROR_MESSAGES[ErrorType.INVALID_CREDENTIALS]);
    });

    it('should handle errors without message', () => {
      // testing handling of auth errors without message property
      const error = {};
      const result = parseAuthError(error);

      expect(result.type).toBe(ErrorType.INVALID_CREDENTIALS);
      expect(result.userMessage).toBe(ERROR_MESSAGES[ErrorType.INVALID_CREDENTIALS]);
    });
  });

  describe('parseNetworkError', () => {
    it('should parse timeout error', () => {
      // testing parsing of network timeout error messages
      const error = { message: 'Request timeout' };
      const result = parseNetworkError(error);

      expect(result.type).toBe(ErrorType.TIMEOUT);
      expect(result.userMessage).toBe(ERROR_MESSAGES[ErrorType.TIMEOUT]);
    });

    it('should parse connection failed error', () => {
      // testing parsing of network connection failed error messages
      const error = { message: 'Network request failed' };
      const result = parseNetworkError(error);

      expect(result.type).toBe(ErrorType.CONNECTION_FAILED);
      expect(result.userMessage).toBe(ERROR_MESSAGES[ErrorType.CONNECTION_FAILED]);
    });

    it('should default to network error for unknown errors', () => {
      // testing default error handling for unknown network errors
      const error = { message: 'Unknown network error' };
      const result = parseNetworkError(error);

      expect(result.type).toBe(ErrorType.NETWORK_ERROR);
      expect(result.userMessage).toBe(ERROR_MESSAGES[ErrorType.NETWORK_ERROR]);
    });

    it('should handle error without message', () => {
      // testing handling of network errors without message property
      const error = {};
      const result = parseNetworkError(error);

      expect(result.type).toBe(ErrorType.NETWORK_ERROR);
      expect(result.userMessage).toBe(ERROR_MESSAGES[ErrorType.NETWORK_ERROR]);
    });

    it('should handle null error', () => {
      // testing handling of null network error objects
      const error = null;
      const result = parseNetworkError(error);

      expect(result.type).toBe(ErrorType.NETWORK_ERROR);
      expect(result.userMessage).toBe(ERROR_MESSAGES[ErrorType.NETWORK_ERROR]);
    });
  });

  describe('parseDatabaseError', () => {
    it('should parse connection reset error', () => {
      // testing parsing of database connection reset error messages
      const error = { message: 'ECONNRESET' };
      const result = parseDatabaseError(error);

      expect(result.type).toBe(ErrorType.DATABASE_ERROR);
      expect(result.userMessage).toBe(ERROR_MESSAGES[ErrorType.DATABASE_ERROR]);
      expect(result.details?.code).toBe('DB_CONNECTION_RESET');
    });

    it('should parse database timeout error', () => {
      // testing parsing of database timeout error messages
      const error = { message: 'Database timeout' };
      const result = parseDatabaseError(error);

      expect(result.type).toBe(ErrorType.DATABASE_ERROR);
      expect(result.userMessage).toBe(ERROR_MESSAGES[ErrorType.DATABASE_ERROR]);
      expect(result.details?.code).toBe('DB_TIMEOUT');
    });

    it('should default to unknown database error', () => {
      // testing default error handling for unknown database errors
      const error = { message: 'Unknown database error' };
      const result = parseDatabaseError(error);

      expect(result.type).toBe(ErrorType.DATABASE_ERROR);
      expect(result.userMessage).toBe(ERROR_MESSAGES[ErrorType.DATABASE_ERROR]);
      expect(result.details?.code).toBe('DB_UNKNOWN');
    });

    it('should handle error without message', () => {
      // testing handling of database errors without message property
      const error = {};
      const result = parseDatabaseError(error);

      expect(result.type).toBe(ErrorType.DATABASE_ERROR);
      expect(result.userMessage).toBe(ERROR_MESSAGES[ErrorType.DATABASE_ERROR]);
      expect(result.details?.code).toBe('DB_UNKNOWN');
    });

    it('should handle null error', () => {
      // testing handling of null database error objects
      const error = null;
      const result = parseDatabaseError(error);

      expect(result.type).toBe(ErrorType.DATABASE_ERROR);
      expect(result.userMessage).toBe(ERROR_MESSAGES[ErrorType.DATABASE_ERROR]);
      expect(result.details?.code).toBe('DB_UNKNOWN');
    });
  });
});
