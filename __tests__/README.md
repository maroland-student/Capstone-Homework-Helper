## Running Tests

To run all tests:
```bash
npm test
```

To run tests in watch mode:
```bash
npm run test:watch
```

## Test Structure

- `settings-simple.test.tsx` - Unit tests for the Settings

## Test Coverage

The tests cover:
- Button press handlers (all settings buttons)
- State management (initial state, state toggles)
- Alert functionality (logout confirmation)
- Settings data structure validation
- Switch configuration (colors and behavior)

## Test Approach

These tests test core logic and functionality of the Settings component using jest with no React Native component rendering

## Dependencies

- Jest - Testing framework
- Babel - Code transformation
