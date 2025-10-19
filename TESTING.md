# Testing

## Running Tests

Run all tests:
```bash
npm test
```

Run with coverage report:
```bash
npm run test:coverage
```

## Test Files

### error-utils.test.ts
Tests error handling utilities including error creation, parsing authentication errors, network errors, and database errors.

### auth-client.test.ts
Tests authentication client configuration and exported methods.

### auth-context.test.ts
Tests authentication context module loading and exports.

### auth-processes.test.ts
Tests authentication processes including login, signup, logout, session management, and error handling.

### schema.test.ts
Tests database schema definitions and table structures.

### LoginForm.simple.test.ts
Tests login form validation logic, error handling, and button state management.

### SignupForm.simple.test.ts
Tests signup form validation logic, rate limiting, error handling, and form state updates.

### LoginForm.comprehensive.test.ts
Tests comprehensive login form functionality including state management, validation, loading states, platform-specific logic, and form submission.

### SignupForm.comprehensive.test.ts
Tests comprehensive signup form functionality including state management, validation, rate limiting, loading states, platform-specific logic, and form submission.

### index.test.ts
Tests main source module loading and initialization.
