/**
 * Validation utilities for equation extraction and parsing
 * Ensures extracted equations are mathematically correct and properly formatted
 */

import { ParsedEquationData } from './equationParser';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates that the equation template and substituted equation are different
 */
export function validateEquationTemplate(
  equation: string,
  substitutedEquation: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!equation || equation.trim() === '') {
    errors.push('Equation template is empty');
  }

  if (!substitutedEquation || substitutedEquation.trim() === '') {
    errors.push('Substituted equation is empty');
  }

  if (equation && substitutedEquation) {
    const eqTrimmed = equation.trim();
    const subTrimmed = substitutedEquation.trim();


    if (eqTrimmed === subTrimmed) {
      errors.push(
        'Equation template and substituted equation are identical. Template should contain variables, not numbers.'
      );
    }

    // Check if template contains numbers (should contain variables instead)
    const hasNumbersInTemplate = /-?\d+(?:\.\d+)?/.test(eqTrimmed);
    if (hasNumbersInTemplate) {
      warnings.push(
        'Equation template contains numbers. It should ideally contain variables (e.g., "y = mx + b" instead of "y = 4x + 30")'
      );
    }

    // Check if substituted equation contains variables (should contain numbers)
    const hasVariablesInSubstituted = /[a-z]\s*[+\-*/=]|[+\-*/=]\s*[a-z]/.test(subTrimmed);
    if (hasVariablesInSubstituted && !hasNumbersInTemplate) {
      warnings.push(
        'Substituted equation may still contain variables. It should contain actual numeric values.'
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates that the equation string is mathematically parseable
 */
export function validateEquationSyntax(equation: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!equation || equation.trim() === '') {
    errors.push('Equation string is empty');
    return { isValid: false, errors, warnings };
  }

  // Check for basic mathematical structure
  const hasEquals = equation.includes('=');
  if (!hasEquals) {
    errors.push('Equation must contain an equals sign (=)');
  }

  // Check for balanced parentheses
  const openParens = (equation.match(/\(/g) || []).length;
  const closeParens = (equation.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push('Unbalanced parentheses in equation');
  }

  // Check for valid mathematical operators
  const validOperators = /[+\-*/=<>≤≥]/;
  const hasOperators = validOperators.test(equation);
  if (!hasOperators && !equation.includes('=')) {
    warnings.push('Equation may be missing mathematical operators');
  }

  // Check for invalid characters (basic check)
  const invalidChars = /[^a-zA-Z0-9\s+\-*/=().,≤≥<>]/;
  if (invalidChars.test(equation)) {
    warnings.push('Equation contains potentially invalid characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates that variables array matches the equation structure
 */
export function validateVariables(
  equation: string,
  substitutedEquation: string,
  variables: string[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(variables)) {
    errors.push('Variables must be an array');
    return { isValid: false, errors, warnings };
  }

  // Extract variable names from equation template
  const templateVars = equation.match(/\b[a-z]\b/gi) || [];
  const uniqueTemplateVars = [...new Set(templateVars.map(v => v.toLowerCase()))];

  // Extract variable names from substituted equation
  const substitutedVars = substitutedEquation.match(/\b[a-z]\b/gi) || [];
  const uniqueSubstitutedVars = [...new Set(substitutedVars.map(v => v.toLowerCase()))];

  // For systems of equations, variables might be empty
  if (equation.includes(',')) {
    // System of equations - variables array can be empty
    if (variables.length > 0) {
      warnings.push(
        'System of equations detected. Variables array is typically empty for systems.'
      );
    }
  } else {
    // Single equation - check if variables are provided
    if (uniqueTemplateVars.length > 0 && variables.length === 0) {
      warnings.push(
        'Equation contains variables but variables array is empty. Consider extracting variable values.'
      );
    }
  }

  // Validate variable format
  variables.forEach((variable, index) => {
    if (typeof variable !== 'string' || variable.trim() === '') {
      errors.push(`Variable at index ${index} is empty or invalid`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates the parsed equation data structure
 */
export function validateParsedData(parsedData: ParsedEquationData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic structure
  if (!parsedData.equation || parsedData.equation.trim() === '') {
    errors.push('Parsed data missing equation template');
  }

  if (!parsedData.substitutedEquation || parsedData.substitutedEquation.trim() === '') {
    errors.push('Parsed data missing substituted equation');
  }

  if (!parsedData.parsed) {
    errors.push('Parsed data missing parsed structure');
    return { isValid: false, errors, warnings };
  }

  // Validate parsed structure
  const { parsed } = parsedData;

  if (!parsed.type || !['linear', 'quadratic', 'system', 'other'].includes(parsed.type)) {
    errors.push(`Invalid equation type: ${parsed.type}`);
  }

  if (!parsed.leftSide || parsed.leftSide.trim() === '') {
    errors.push('Parsed data missing left side of equation');
  }

  if (!parsed.rightSide || parsed.rightSide.trim() === '') {
    warnings.push('Parsed data missing right side of equation (may be valid for some formats)');
  }

  // Validate coefficients
  if (!parsed.coefficients || typeof parsed.coefficients !== 'object') {
    errors.push('Parsed data missing or invalid coefficients object');
  } else {
    Object.entries(parsed.coefficients).forEach(([varName, coeff]) => {
      if (typeof coeff !== 'number' || !isFinite(coeff)) {
        errors.push(`Invalid coefficient for variable ${varName}: ${coeff}`);
      }
    });
  }

  // Validate constants
  if (!Array.isArray(parsed.constants)) {
    errors.push('Parsed data constants must be an array');
  } else {
    parsed.constants.forEach((constant, index) => {
      if (typeof constant !== 'number' || !isFinite(constant)) {
        errors.push(`Invalid constant at index ${index}: ${constant}`);
      }
    });
  }

  // Validate terms
  if (!Array.isArray(parsed.terms)) {
    errors.push('Parsed data terms must be an array');
  } else {
    parsed.terms.forEach((term, index) => {
      if (typeof term.coefficient !== 'number' || !isFinite(term.coefficient)) {
        errors.push(`Invalid term coefficient at index ${index}: ${term.coefficient}`);
      }
      if (typeof term.isConstant !== 'boolean') {
        errors.push(`Invalid isConstant flag at index ${index}: ${term.isConstant}`);
      }
    });
  }

  // Validate structure format
  if (!parsed.structure || !parsed.structure.format) {
    warnings.push('Parsed data missing structure format');
  }

  // Type-specific validations
  if (parsed.type === 'linear' && parsed.structure?.format === 'slope-intercept') {
    if (parsed.structure.slope === undefined || !isFinite(parsed.structure.slope)) {
      warnings.push('Slope-intercept form missing valid slope value');
    }
    if (parsed.structure.yIntercept === undefined || !isFinite(parsed.structure.yIntercept)) {
      warnings.push('Slope-intercept form missing valid y-intercept value');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates that coefficients can be used for calculations
 */
export function validateCoefficientsForCalculation(
  parsedData: ParsedEquationData
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!parsedData.parsed) {
    errors.push('Cannot validate coefficients: parsed data is missing');
    return { isValid: false, errors, warnings };
  }

  const { coefficients, constants, terms } = parsedData.parsed;

  // Check if we have enough data to perform calculations
  if (Object.keys(coefficients).length === 0 && constants.length === 0) {
    errors.push('No coefficients or constants found - cannot perform calculations');
  }

  // Check for NaN or Infinity values
  Object.entries(coefficients).forEach(([varName, coeff]) => {
    if (isNaN(coeff) || !isFinite(coeff)) {
      errors.push(`Coefficient for ${varName} is NaN or Infinity: ${coeff}`);
    }
  });

  constants.forEach((constant, index) => {
    if (isNaN(constant) || !isFinite(constant)) {
      errors.push(`Constant at index ${index} is NaN or Infinity: ${constant}`);
    }
  });

  // Check if terms are consistent with coefficients
  const coefficientSum = Object.values(coefficients).reduce((sum, val) => sum + Math.abs(val), 0);
  if (coefficientSum === 0 && constants.length === 0) {
    warnings.push('All coefficients are zero - equation may not be meaningful');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Comprehensive validation of equation data before saving
 */
export function validateEquationData(
  equation: string,
  substitutedEquation: string,
  variables: string[],
  parsedData?: ParsedEquationData
): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Validate template vs substituted
  const templateValidation = validateEquationTemplate(equation, substitutedEquation);
  allErrors.push(...templateValidation.errors);
  allWarnings.push(...templateValidation.warnings);

  // Validate equation syntax
  const syntaxValidation = validateEquationSyntax(equation);
  allErrors.push(...syntaxValidation.errors);
  allWarnings.push(...syntaxValidation.warnings);

  const substitutedSyntaxValidation = validateEquationSyntax(substitutedEquation);
  allErrors.push(...substitutedSyntaxValidation.errors);
  allWarnings.push(...substitutedSyntaxValidation.warnings);

  // Validate variables
  const variablesValidation = validateVariables(equation, substitutedEquation, variables);
  allErrors.push(...variablesValidation.errors);
  allWarnings.push(...variablesValidation.warnings);

  // Validate parsed data if provided
  if (parsedData) {
    const parsedValidation = validateParsedData(parsedData);
    allErrors.push(...parsedValidation.errors);
    allWarnings.push(...parsedValidation.warnings);

    const calculationValidation = validateCoefficientsForCalculation(parsedData);
    allErrors.push(...calculationValidation.errors);
    allWarnings.push(...calculationValidation.warnings);
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

