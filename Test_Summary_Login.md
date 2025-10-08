# Test Suite for Login Framework

## Overview

This test suite verifies the basic skeleton of the login flow and redirect behavior of the Expo app using **Jest**.

---

## What's Tested

### `LoginLogic.test.js`

- **Successful Login** — Navigates to the Explore tab when valid credentials are provided.  
- **Empty Email** — Verifies that navigation does **not** occur when the email field is empty.  
- **Empty Password** — Verifies that navigation does **not** occur when the password field is empty.  
- **Whitespace Handling** — Ensures whitespace is properly trimmed from inputs.  
- **Whitespace Only Inputs** — Verifies that navigation does **not** occur when inputs contain only whitespace.

---

## Test Config

### Dependencies

```json
{
  "@testing-library/react-native": "^12.4.2",
  "@testing-library/jest-native": "^5.4.3",
  "jest": "^29.7.0",
  "jest-expo": "~52.0.1",
  "react-test-renderer": "19.1.0"
}

```



# Run all tests

```json
npm test
```

# Run tests in watch mode (reruns on file changes)

```json
npm run test:watch
```

# Run tests with coverage report

```json
npm run test:coverage
```



## File Structure

__tests__/
└── LoginLogic.test.js     - Login logic tests

jest.config.js             - Jest configuration 
jest.setup.js              - Test setup and mocks
babel.config.js            - Babel configuration
TEST_SUMMARY.md            - Test summary


