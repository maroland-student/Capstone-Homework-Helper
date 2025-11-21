/**
 * Tests for equation validation utilities
 */

import { ParsedEquationData, parseEquationData } from '../equationParser';
import {
    validateCoefficientsForCalculation,
    validateEquationData,
    validateEquationSyntax,
    validateEquationTemplate,
    validateParsedData,
    validateVariables,
} from '../equationValidator';

describe('validateEquationTemplate', () => {
  it('should pass when template and substituted are different', () => {
    const result = validateEquationTemplate('y = mx + b', 'y = 4x + 30');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail when template and substituted are identical', () => {
    const result = validateEquationTemplate('y = 4x + 30', 'y = 4x + 30');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('identical');
  });

  it('should warn when template contains numbers', () => {
    const result = validateEquationTemplate('y = 4x + 30', 'y = 4x + 30');
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some(w => w.includes('numbers'))).toBe(true);
  });

  it('should fail when equation is empty', () => {
    const result = validateEquationTemplate('', 'y = 4x + 30');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('empty'))).toBe(true);
  });

  it('should fail when substituted equation is empty', () => {
    const result = validateEquationTemplate('y = mx + b', '');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('empty'))).toBe(true);
  });
});

describe('validateEquationSyntax', () => {
  it('should pass for valid equation', () => {
    const result = validateEquationSyntax('y = 4x + 30');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail when equation is empty', () => {
    const result = validateEquationSyntax('');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('empty'))).toBe(true);
  });

  it('should fail when equation has no equals sign', () => {
    const result = validateEquationSyntax('y 4x + 30');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('equals'))).toBe(true);
  });

  it('should fail for unbalanced parentheses', () => {
    const result = validateEquationSyntax('y = (4x + 30');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('parentheses'))).toBe(true);
  });

  it('should pass for balanced parentheses', () => {
    const result = validateEquationSyntax('y = (4x + 30)');
    expect(result.isValid).toBe(true);
  });

  it('should pass for system of equations', () => {
    const result = validateEquationSyntax('x + y = 85, 12x + 8y = 820');
    expect(result.isValid).toBe(true);
  });
});

describe('validateVariables', () => {
  it('should pass for valid variables array', () => {
    const result = validateVariables(
      'y = mx + b',
      'y = 4x + 30',
      ['slope m = 4', 'y-intercept b = 30']
    );
    expect(result.isValid).toBe(true);
  });

  it('should fail when variables is not an array', () => {
    const result = validateVariables('y = mx + b', 'y = 4x + 30', {} as any);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('array'))).toBe(true);
  });

  it('should warn for system of equations with variables', () => {
    const result = validateVariables(
      'x + y = total, ax + by = cost',
      'x + y = 85, 12x + 8y = 820',
      ['some variable']
    );
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should warn when variables array is empty but equation has variables', () => {
    const result = validateVariables('y = mx + b', 'y = 4x + 30', []);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should fail for empty variable strings', () => {
    const result = validateVariables('y = mx + b', 'y = 4x + 30', ['', 'valid']);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('validateParsedData', () => {
  const createValidParsedData = (): ParsedEquationData => ({
    equation: 'y = mx + b',
    substitutedEquation: 'y = 4x + 30',
    variables: ['slope m = 4', 'y-intercept b = 30'],
    parsed: {
      type: 'linear',
      leftSide: 'y',
      rightSide: '4x + 30',
      coefficients: { x: 4 },
      constants: [30],
      terms: [
        { variable: 'y', coefficient: 1, isConstant: false },
        { variable: 'x', coefficient: 4, isConstant: false },
        { variable: null, coefficient: 30, isConstant: true },
      ],
      structure: {
        format: 'slope-intercept',
        slope: 4,
        yIntercept: 30,
      },
    },
    timestamp: new Date().toISOString(),
  });

  it('should pass for valid parsed data', () => {
    const data = createValidParsedData();
    const result = validateParsedData(data);
    expect(result.isValid).toBe(true);
  });

  it('should fail when equation is missing', () => {
    const data = createValidParsedData();
    data.equation = '';
    const result = validateParsedData(data);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('equation'))).toBe(true);
  });

  it('should fail when parsed structure is missing', () => {
    const data = createValidParsedData();
    (data as any).parsed = null;
    const result = validateParsedData(data);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('parsed'))).toBe(true);
  });

  it('should fail for invalid equation type', () => {
    const data = createValidParsedData();
    (data.parsed as any).type = 'invalid';
    const result = validateParsedData(data);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('type'))).toBe(true);
  });

  it('should fail for invalid coefficients', () => {
    const data = createValidParsedData();
    (data.parsed.coefficients as any).x = NaN;
    const result = validateParsedData(data);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('coefficient'))).toBe(true);
  });

  it('should fail for invalid constants', () => {
    const data = createValidParsedData();
    data.parsed.constants = [NaN];
    const result = validateParsedData(data);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('constant'))).toBe(true);
  });

  it('should warn for missing slope-intercept values', () => {
    const data = createValidParsedData();
    data.parsed.structure = { format: 'slope-intercept' };
    const result = validateParsedData(data);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('validateCoefficientsForCalculation', () => {
  it('should pass for valid coefficients', () => {
    const data: ParsedEquationData = {
      equation: 'y = mx + b',
      substitutedEquation: 'y = 4x + 30',
      variables: [],
      parsed: {
        type: 'linear',
        leftSide: 'y',
        rightSide: '4x + 30',
        coefficients: { x: 4 },
        constants: [30],
        terms: [],
        structure: { format: 'slope-intercept' },
      },
      timestamp: new Date().toISOString(),
    };
    const result = validateCoefficientsForCalculation(data);
    expect(result.isValid).toBe(true);
  });

  it('should fail when no coefficients or constants', () => {
    const data: ParsedEquationData = {
      equation: 'y = mx + b',
      substitutedEquation: 'y = 4x + 30',
      variables: [],
      parsed: {
        type: 'linear',
        leftSide: 'y',
        rightSide: '4x + 30',
        coefficients: {},
        constants: [],
        terms: [],
        structure: { format: 'slope-intercept' },
      },
      timestamp: new Date().toISOString(),
    };
    const result = validateCoefficientsForCalculation(data);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('No coefficients'))).toBe(true);
  });

  it('should fail for NaN coefficients', () => {
    const data: ParsedEquationData = {
      equation: 'y = mx + b',
      substitutedEquation: 'y = 4x + 30',
      variables: [],
      parsed: {
        type: 'linear',
        leftSide: 'y',
        rightSide: '4x + 30',
        coefficients: { x: NaN },
        constants: [30],
        terms: [],
        structure: { format: 'slope-intercept' },
      },
      timestamp: new Date().toISOString(),
    };
    const result = validateCoefficientsForCalculation(data);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('NaN'))).toBe(true);
  });

    it('should warn when all coefficients are zero', () => {
      const data: ParsedEquationData = {
        equation: 'y = mx + b',
        substitutedEquation: 'y = 0x + 0',
        variables: [],
        parsed: {
          type: 'linear',
          leftSide: 'y',
          rightSide: '0x + 0',
          coefficients: { x: 0 },
          constants: [], // Empty constants array to trigger warning
          terms: [],
          structure: { format: 'slope-intercept' },
        },
        timestamp: new Date().toISOString(),
      };
      const result = validateCoefficientsForCalculation(data);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
});

describe('validateEquationData (comprehensive)', () => {
  it('should pass for complete valid equation data', () => {
    const parsedData = parseEquationData(
      'y = mx + b',
      'y = 4x + 30',
      ['slope m = 4', 'y-intercept b = 30']
    );
    const result = validateEquationData(
      'y = mx + b',
      'y = 4x + 30',
      ['slope m = 4', 'y-intercept b = 30'],
      parsedData
    );
    expect(result.isValid).toBe(true);
  });

  it('should fail for identical template and substituted', () => {
    const parsedData = parseEquationData('y = 4x + 30', 'y = 4x + 30', []);
    const result = validateEquationData('y = 4x + 30', 'y = 4x + 30', [], parsedData);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should validate system of equations', () => {
    const parsedData = parseEquationData(
      'x + y = total, ax + by = cost',
      'x + y = 85, 12x + 8y = 820',
      []
    );
    const result = validateEquationData(
      'x + y = total, ax + by = cost',
      'x + y = 85, 12x + 8y = 820',
      [],
      parsedData
    );
    // Should pass validation (warnings may exist but no errors)
    expect(result.errors.length).toBe(0);
  });

  it('should catch multiple validation issues', () => {
    const result = validateEquationData('', '', null as any, undefined);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

