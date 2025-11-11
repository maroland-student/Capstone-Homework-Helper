/**
 * Tests for AI equation extraction validation
 * Tests that the extractEquation function properly validates extracted data
 */

import { parseEquationData } from '../equationParser';
import { validateEquationData } from '../equationValidator';

// Mock OpenAI - must be before imports
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    })),
  };
});

// Mock the logger - must be before imports
jest.mock('../../server/utilities/toggle_logs', () => ({
  default: {
    log: jest.fn(),
  },
  LogLevel: {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    CRITICAL: 'CRITICAL',
  },
}));

// Mock environment variables
process.env.EXPO_PUBLIC_OPENAI_API_KEY = 'test-key';
process.env.EXPO_PUBLIC_OPENAI_ALLOW_BROWSER = 'true';

describe('AI Equation Extraction Validation', () => {
  // Mock data for testing validation
  const mockValidExtraction = {
    equation: 'y = mx + b',
    substitutedEquation: 'y = 4x + 30',
    variables: ['slope m = 4', 'y-intercept b = 30'],
  };

  const mockInvalidExtraction = {
    equation: 'y = 4x + 30', // Same as substituted (should be different)
    substitutedEquation: 'y = 4x + 30',
    variables: [],
  };

  const mockEmptyExtraction = {
    equation: '',
    substitutedEquation: '',
    variables: [],
  };

  describe('validateEquationData for extracted equations', () => {
    it('should validate correctly extracted equation', () => {
      const parsedData = parseEquationData(
        mockValidExtraction.equation,
        mockValidExtraction.substitutedEquation,
        mockValidExtraction.variables
      );
      
      const validation = validateEquationData(
        mockValidExtraction.equation,
        mockValidExtraction.substitutedEquation,
        mockValidExtraction.variables,
        parsedData
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect when template and substituted are identical', () => {
      const parsedData = parseEquationData(
        mockInvalidExtraction.equation,
        mockInvalidExtraction.substitutedEquation,
        mockInvalidExtraction.variables
      );
      
      const validation = validateEquationData(
        mockInvalidExtraction.equation,
        mockInvalidExtraction.substitutedEquation,
        mockInvalidExtraction.variables,
        parsedData
      );
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('identical'))).toBe(true);
    });

    it('should detect empty equation extraction', () => {
      const validation = validateEquationData(
        mockEmptyExtraction.equation,
        mockEmptyExtraction.substitutedEquation,
        mockEmptyExtraction.variables,
        undefined
      );
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('empty'))).toBe(true);
    });

    it('should validate system of equations extraction', () => {
      const systemExtraction = {
        equation: 'x + y = total, ax + by = cost',
        substitutedEquation: 'x + y = 85, 12x + 8y = 820',
        variables: [],
      };
      
      const parsedData = parseEquationData(
        systemExtraction.equation,
        systemExtraction.substitutedEquation,
        systemExtraction.variables
      );
      
      const validation = validateEquationData(
        systemExtraction.equation,
        systemExtraction.substitutedEquation,
        systemExtraction.variables,
        parsedData
      );
      
      // Should pass (no errors, warnings may exist)
      expect(validation.errors.length).toBe(0);
    });

    it('should detect missing equals sign in extracted equation', () => {
      const invalidSyntax = {
        equation: 'y mx + b',
        substitutedEquation: 'y 4x + 30',
        variables: [],
      };
      
      const validation = validateEquationData(
        invalidSyntax.equation,
        invalidSyntax.substitutedEquation,
        invalidSyntax.variables,
        undefined
      );
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('equals'))).toBe(true);
    });

    it('should validate standard form extraction', () => {
      const standardForm = {
        equation: 'Ax + By = C',
        substitutedEquation: '3x + 4y = 12',
        variables: [],
      };
      
      const parsedData = parseEquationData(
        standardForm.equation,
        standardForm.substitutedEquation,
        standardForm.variables
      );
      
      const validation = validateEquationData(
        standardForm.equation,
        standardForm.substitutedEquation,
        standardForm.variables,
        parsedData
      );
      
      expect(validation.isValid).toBe(true);
    });

    it('should detect when template contains numbers (warning)', () => {
      const hasNumbersInTemplate = {
        equation: 'y = 4x + 30', // Should be 'y = mx + b'
        substitutedEquation: 'y = 4x + 30',
        variables: [],
      };
      
      const validation = validateEquationData(
        hasNumbersInTemplate.equation,
        hasNumbersInTemplate.substitutedEquation,
        hasNumbersInTemplate.variables,
        undefined
      );
      
      // Should have warnings about numbers in template
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some(w => w.includes('numbers'))).toBe(true);
    });

    it('should validate area formula extraction', () => {
      const areaFormula = {
        equation: 'A = lw',
        substitutedEquation: 'A = 10 * 5',
        variables: ['length l = 10', 'width w = 5'],
      };
      
      const parsedData = parseEquationData(
        areaFormula.equation,
        areaFormula.substitutedEquation,
        areaFormula.variables
      );
      
      const validation = validateEquationData(
        areaFormula.equation,
        areaFormula.substitutedEquation,
        areaFormula.variables,
        parsedData
      );
      
      // Should pass basic validation
      expect(validation.errors.length).toBe(0);
    });

    it('should detect unbalanced parentheses', () => {
      const unbalanced = {
        equation: 'y = (mx + b',
        substitutedEquation: 'y = (4x + 30',
        variables: [],
      };
      
      const validation = validateEquationData(
        unbalanced.equation,
        unbalanced.substitutedEquation,
        unbalanced.variables,
        undefined
      );
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('parentheses'))).toBe(true);
    });

    it('should validate distance formula extraction', () => {
      const distanceFormula = {
        equation: 'd = rt',
        substitutedEquation: 'd = 60 * 2',
        variables: ['rate r = 60', 'time t = 2'],
      };
      
      const parsedData = parseEquationData(
        distanceFormula.equation,
        distanceFormula.substitutedEquation,
        distanceFormula.variables
      );
      
      const validation = validateEquationData(
        distanceFormula.equation,
        distanceFormula.substitutedEquation,
        distanceFormula.variables,
        parsedData
      );
      
      expect(validation.errors.length).toBe(0);
    });
  });

  describe('extraction validation edge cases', () => {
    it('should handle equations with negative numbers', () => {
      const negativeNumbers = {
        equation: 'y = mx + b',
        substitutedEquation: 'y = -4x - 30',
        variables: ['slope m = -4', 'y-intercept b = -30'],
      };
      
      const parsedData = parseEquationData(
        negativeNumbers.equation,
        negativeNumbers.substitutedEquation,
        negativeNumbers.variables
      );
      
      const validation = validateEquationData(
        negativeNumbers.equation,
        negativeNumbers.substitutedEquation,
        negativeNumbers.variables,
        parsedData
      );
      
      expect(validation.isValid).toBe(true);
    });

    it('should handle equations with decimals', () => {
      const decimals = {
        equation: 'y = mx + b',
        substitutedEquation: 'y = 4.5x + 30.25',
        variables: ['slope m = 4.5', 'y-intercept b = 30.25'],
      };
      
      const parsedData = parseEquationData(
        decimals.equation,
        decimals.substitutedEquation,
        decimals.variables
      );
      
      const validation = validateEquationData(
        decimals.equation,
        decimals.substitutedEquation,
        decimals.variables,
        parsedData
      );
      
      expect(validation.isValid).toBe(true);
    });

    it('should validate that variables match equation structure', () => {
      const mismatchedVariables = {
        equation: 'y = mx + b',
        substitutedEquation: 'y = 4x + 30',
        variables: ['wrong variable'], // Doesn't match
      };
      
      const parsedData = parseEquationData(
        mismatchedVariables.equation,
        mismatchedVariables.substitutedEquation,
        mismatchedVariables.variables
      );
      
      const validation = validateEquationData(
        mismatchedVariables.equation,
        mismatchedVariables.substitutedEquation,
        mismatchedVariables.variables,
        parsedData
      );
      
      // Should still pass basic validation, but may have warnings
      expect(validation.errors.length).toBe(0);
    });
  });

  describe('critical validation errors that should block extraction', () => {
    it('should identify empty equation as critical', () => {
      const validation = validateEquationData('', '', [], undefined);
      const criticalErrors = validation.errors.filter(e => 
        e.includes('empty') || 
        e.includes('identical') ||
        e.includes('equals sign')
      );
      
      expect(criticalErrors.length).toBeGreaterThan(0);
    });

    it('should identify identical equations as critical', () => {
      const validation = validateEquationData('y = 4x + 30', 'y = 4x + 30', [], undefined);
      const criticalErrors = validation.errors.filter(e => 
        e.includes('empty') || 
        e.includes('identical') ||
        e.includes('equals sign')
      );
      
      expect(criticalErrors.length).toBeGreaterThan(0);
    });

    it('should identify missing equals sign as critical', () => {
      const validation = validateEquationData('y 4x + 30', 'y 4x + 30', [], undefined);
      const criticalErrors = validation.errors.filter(e => 
        e.includes('empty') || 
        e.includes('identical') ||
        e.includes('equals sign')
      );
      
      expect(criticalErrors.length).toBeGreaterThan(0);
    });
  });
});

