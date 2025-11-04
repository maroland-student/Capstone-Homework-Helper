/**
 * Parses equations and extracts structured data for calculator use
 * Extracts coefficients, variables, constants, and equation structure
 */

export interface ParsedEquationData {
  equation: string;
  substitutedEquation: string;
  variables: string[];
  parsed: {
    type: 'linear' | 'quadratic' | 'system' | 'other';
    leftSide: string;
    rightSide: string;
    coefficients: {
      [variable: string]: number;
    };
    constants: number[];
    terms: Array<{
      variable: string | null;
      coefficient: number;
      isConstant: boolean;
    }>;
    structure: {
      format: string; // e.g., "slope-intercept", "standard", "point-slope"
      slope?: number;
      yIntercept?: number;
      xIntercept?: number;
    };
  };
  timestamp: string;
}

/**
 * Parses a linear equation in slope-intercept form (y = mx + b)
 */
function parseSlopeIntercept(equation: string): ParsedEquationData['parsed'] | null {
  const pattern = /y\s*=\s*(-?\d+(?:\.\d+)?)\s*\*\s*x\s*([+\-])\s*(-?\d+(?:\.\d+)?)|y\s*=\s*(-?\d+(?:\.\d+)?)\s*x\s*([+\-])\s*(-?\d+(?:\.\d+)?)|y\s*=\s*(-?\d+(?:\.\d+)?)\s*x|y\s*=\s*x\s*([+\-])\s*(-?\d+(?:\.\d+)?)/;
  const match = equation.match(pattern);
  
  if (!match) return null;

  let slope = 0;
  let yIntercept = 0;

  // Handle different patterns
  if (match[1] && match[2] && match[3]) {
    // y = mx * x + b
    slope = parseFloat(match[1]);
    yIntercept = match[2] === '+' ? parseFloat(match[3]) : -parseFloat(match[3]);
  } else if (match[4] && match[5] && match[6]) {
    // y = mx + b
    slope = parseFloat(match[4]);
    yIntercept = match[5] === '+' ? parseFloat(match[6]) : -parseFloat(match[6]);
  } else if (match[7]) {
    // y = mx (no intercept)
    slope = parseFloat(match[7]);
  } else if (match[8] && match[9]) {
    // y = x + b
    slope = 1;
    yIntercept = match[8] === '+' ? parseFloat(match[9]) : -parseFloat(match[9]);
  }

  const terms = [
    { variable: 'y', coefficient: 1, isConstant: false },
    { variable: 'x', coefficient: slope, isConstant: false },
    { variable: null, coefficient: yIntercept, isConstant: true },
  ];

  return {
    type: 'linear',
    leftSide: 'y',
    rightSide: `${slope}x + ${yIntercept}`,
    coefficients: { x: slope },
    constants: [yIntercept],
    terms,
    structure: {
      format: 'slope-intercept',
      slope,
      yIntercept,
    },
  };
}

/**
 * Parses a standard form equation (Ax + By = C)
 */
function parseStandardForm(equation: string): ParsedEquationData['parsed'] | null {
  const pattern = /(-?\d+(?:\.\d+)?)\s*x\s*([+\-])\s*(-?\d+(?:\.\d+)?)\s*y\s*=\s*(-?\d+(?:\.\d+)?)/;
  const match = equation.match(pattern);
  
  if (!match) return null;

  const a = parseFloat(match[1]);
  const bSign = match[2] === '+' ? 1 : -1;
  const b = parseFloat(match[3]) * bSign;
  const c = parseFloat(match[4]);

  return {
    type: 'linear',
    leftSide: `${a}x + ${b}y`,
    rightSide: `${c}`,
    coefficients: { x: a, y: b },
    constants: [c],
    terms: [
      { variable: 'x', coefficient: a, isConstant: false },
      { variable: 'y', coefficient: b, isConstant: false },
      { variable: null, coefficient: -c, isConstant: true },
    ],
    structure: {
      format: 'standard',
    },
  };
}

/**
 * Parses a system of equations
 */
function parseSystem(equations: string[]): ParsedEquationData['parsed'] | null {
  if (equations.length < 2) return null;

  const parsedEquations = equations.map(eq => {
    const stdForm = parseStandardForm(eq);
    if (stdForm) return stdForm;
    
    // Try to parse as simple addition: x + y = number
    const simplePattern = /([a-z])\s*\+\s*([a-z])\s*=\s*(-?\d+(?:\.\d+)?)/;
    const match = eq.match(simplePattern);
    if (match) {
      return {
        type: 'linear' as const,
        leftSide: `${match[1]} + ${match[2]}`,
        rightSide: match[3],
        coefficients: { [match[1]]: 1, [match[2]]: 1 },
        constants: [parseFloat(match[3])],
        terms: [
          { variable: match[1], coefficient: 1, isConstant: false },
          { variable: match[2], coefficient: 1, isConstant: false },
          { variable: null, coefficient: -parseFloat(match[3]), isConstant: true },
        ],
        structure: { format: 'simple' },
      };
    }
    return null;
  }).filter(eq => eq !== null);

  if (parsedEquations.length === 0) return null;

  // Combine coefficients from all equations
  const allCoefficients: { [key: string]: number[] } = {};
  const allConstants: number[] = [];

  parsedEquations.forEach((eq, index) => {
    Object.keys(eq.coefficients).forEach(varName => {
      if (!allCoefficients[varName]) allCoefficients[varName] = [];
      allCoefficients[varName][index] = eq.coefficients[varName];
    });
    allConstants.push(...eq.constants);
  });

  return {
    type: 'system',
    leftSide: equations.join(', '),
    rightSide: '',
    coefficients: Object.keys(allCoefficients).reduce((acc, key) => {
      acc[key] = allCoefficients[key][0] || 0;
      return acc;
    }, {} as { [key: string]: number }),
    constants: allConstants,
    terms: parsedEquations.flatMap(eq => eq.terms),
    structure: {
      format: 'system',
    },
  };
}

/**
 * Extracts coefficient and variable information from an equation string
 */
function extractCoefficients(equation: string): {
  coefficients: { [variable: string]: number };
  constants: number[];
  terms: Array<{ variable: string | null; coefficient: number; isConstant: boolean }>;
} {
  const coefficients: { [variable: string]: number } = {};
  const constants: number[] = [];
  const terms: Array<{ variable: string | null; coefficient: number; isConstant: boolean }> = [];

  // Match terms like: -2x, 3y, 5, -1.5z, etc.
  const termPattern = /([+\-]?)\s*(\d+(?:\.\d+)?)?\s*([a-z])|([+\-]?)\s*(\d+(?:\.\d+)?)(?=\s*[+\-=]|$)/g;
  let match;

  while ((match = termPattern.exec(equation)) !== null) {
    const sign = (match[1] || match[4] || '+') === '-' ? -1 : 1;
    
    if (match[3]) {
      // Variable term: coefficient * variable
      const variable = match[3];
      const coeffValue = match[2] ? parseFloat(match[2]) : 1;
      const coefficient = sign * coeffValue;
      
      coefficients[variable] = (coefficients[variable] || 0) + coefficient;
      terms.push({ variable, coefficient, isConstant: false });
    } else if (match[5]) {
      // Constant term
      const constant = sign * parseFloat(match[5]);
      constants.push(constant);
      terms.push({ variable: null, coefficient: constant, isConstant: true });
    }
  }

  return { coefficients, constants, terms };
}

/**
 * Main function to parse equation data into calculator-ready format
 */
export function parseEquationData(
  equation: string,
  substitutedEquation: string,
  variables: string[]
): ParsedEquationData {
  // Try different parsing strategies
  let parsed: ParsedEquationData['parsed'];

  // Try slope-intercept form first
  const slopeIntercept = parseSlopeIntercept(substitutedEquation);
  if (slopeIntercept) {
    parsed = slopeIntercept;
  } else {
    // Try standard form
    const standardForm = parseStandardForm(substitutedEquation);
    if (standardForm) {
      parsed = standardForm;
    } else {
      // Try system of equations
      const equations = substitutedEquation.split(',').map(eq => eq.trim());
      const system = parseSystem(equations);
      if (system) {
        parsed = system;
      } else {
        // Fallback: extract coefficients generically
        const extracted = extractCoefficients(substitutedEquation);
        const [leftSide, rightSide] = substitutedEquation.split('=').map(s => s.trim());
        
        parsed = {
          type: 'other',
          leftSide: leftSide || '',
          rightSide: rightSide || '',
          coefficients: extracted.coefficients,
          constants: extracted.constants,
          terms: extracted.terms,
          structure: {
            format: 'generic',
          },
        };
      }
    }
  }

  return {
    equation,
    substitutedEquation,
    variables,
    parsed,
    timestamp: new Date().toISOString(),
  };
}

