export enum ErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  INVALID_EMAIL = 'INVALID_EMAIL',
  PASSWORD_TOO_SHORT = 'PASSWORD_TOO_SHORT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  code?: string;
  details?: any;
}

export const createError = (
  type: ErrorType,
  message: string,
  userMessage: string,
  details?: any
): AppError => ({
  type,
  message,
  userMessage,
  details,
});

export const ERROR_MESSAGES = {
  [ErrorType.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorType.USER_NOT_FOUND]: 'No account found with this email',
  [ErrorType.EMAIL_ALREADY_EXISTS]: 'An account with this email already exists',
  [ErrorType.WEAK_PASSWORD]: 'Password must be at least 6 characters long',
  [ErrorType.SESSION_EXPIRED]: 'Your session has expired. Please sign in again',
  [ErrorType.REQUIRED_FIELD]: 'Please fill in all required fields',
  [ErrorType.INVALID_EMAIL]: 'Please enter a valid email address',
  [ErrorType.PASSWORD_TOO_SHORT]: 'Password must be at least 6 characters long',
  [ErrorType.NETWORK_ERROR]: 'Network error. Please check your connection',
  [ErrorType.TIMEOUT]: 'Request timed out. Please try again',
  [ErrorType.CONNECTION_FAILED]: 'Unable to connect to server. Please try again',
  [ErrorType.DATABASE_ERROR]: 'Database error. Please try again later',
  [ErrorType.INTERNAL_ERROR]: 'Internal server error. Please try again later',
  [ErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again',
};

export const parseAuthError = (error: any): AppError => {
  const errorMessage = error?.message || '';
  
  if (errorMessage.includes('Invalid credentials') || 
      errorMessage.includes('invalid') || 
      errorMessage.includes('incorrect')) {
    return createError(
      ErrorType.INVALID_CREDENTIALS,
      errorMessage,
      ERROR_MESSAGES[ErrorType.INVALID_CREDENTIALS],
      { originalError: errorMessage }
    );
  }
  
  if (errorMessage.includes('User not found') || 
      errorMessage.includes('not found')) {
    return createError(
      ErrorType.USER_NOT_FOUND,
      errorMessage,
      ERROR_MESSAGES[ErrorType.USER_NOT_FOUND],
      { originalError: errorMessage }
    );
  }
  
  if (errorMessage.includes('Email already exists') || 
      errorMessage.includes('duplicate')) {
    return createError(
      ErrorType.EMAIL_ALREADY_EXISTS,
      errorMessage,
      ERROR_MESSAGES[ErrorType.EMAIL_ALREADY_EXISTS],
      { originalError: errorMessage }
    );
  }
  
  if (errorMessage.includes('Password too weak') || 
      errorMessage.includes('weak password')) {
    return createError(
      ErrorType.WEAK_PASSWORD,
      errorMessage,
      ERROR_MESSAGES[ErrorType.WEAK_PASSWORD],
      { originalError: errorMessage }
    );
  }
  
  return createError(
    ErrorType.INVALID_CREDENTIALS,
    errorMessage,
    ERROR_MESSAGES[ErrorType.INVALID_CREDENTIALS],
    { originalError: errorMessage }
  );
};

export const parseNetworkError = (error: any): AppError => {
  const errorMessage = error?.message || '';
  
  if (errorMessage.includes('timeout') || 
      errorMessage.includes('TIMEOUT')) {
    return createError(
      ErrorType.TIMEOUT,
      errorMessage,
      ERROR_MESSAGES[ErrorType.TIMEOUT],
      { originalError: errorMessage }
    );
  }
  
  if (errorMessage.includes('Network request failed') || 
      errorMessage.includes('fetch')) {
    return createError(
      ErrorType.CONNECTION_FAILED,
      errorMessage,
      ERROR_MESSAGES[ErrorType.CONNECTION_FAILED],
      { originalError: errorMessage }
    );
  }
  
  return createError(
    ErrorType.NETWORK_ERROR,
    errorMessage,
    ERROR_MESSAGES[ErrorType.NETWORK_ERROR],
    { originalError: errorMessage }
  );
};

export const parseDatabaseError = (error: any): AppError => {
  const errorMessage = error?.message || '';
  
  if (errorMessage.includes('ECONNRESET') || 
      errorMessage.includes('connection')) {
    return createError(
      ErrorType.DATABASE_ERROR,
      errorMessage,
      ERROR_MESSAGES[ErrorType.DATABASE_ERROR],
      { originalError: errorMessage, code: 'DB_CONNECTION_RESET' }
    );
  }
  
  if (errorMessage.includes('timeout') || 
      errorMessage.includes('TIMEOUT')) {
    return createError(
      ErrorType.DATABASE_ERROR,
      errorMessage,
      ERROR_MESSAGES[ErrorType.DATABASE_ERROR],
      { originalError: errorMessage, code: 'DB_TIMEOUT' }
    );
  }
  
  return createError(
    ErrorType.DATABASE_ERROR,
    errorMessage,
    ERROR_MESSAGES[ErrorType.DATABASE_ERROR],
    { originalError: errorMessage, code: 'DB_UNKNOWN' }
  );
};
