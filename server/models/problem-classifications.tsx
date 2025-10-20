import Log, { LogLevel } from '../utilities/toggle_logs';

// Enum definitions
export enum SubjectId {
  Variables,
  Expressions,
  OrderOfOperations,
  FunctionsGeneral,
  SystemsOfEquations,
  Polynomials,
  LinearFunctions,
  QuadraticFunctions,
  Exponents,
  AbsoluteValue,
  Radicals,
  LinearEquations,
  LinearInequalities,
  SystemsOfInequalities,
  SlopeIntercept,
  FunctionBasics,
  DomainRange,
  Piecewise,
  Factoring,
  CompletingTheSquare,
  QuadraticFormula,
  ScientificNotation,
  SequencesArithmetic,
}

// Interface definitions
export interface ProblemClassification {
    id: number                              // Unique identifier for the classification
    name: string                            // Name of the classification
    confidence: number                      // Confidence level of the classification (0.00 to 1.00)   
    subjects: ReadonlyArray<SubjectInfo>    // Optional subject information associated with the classification
    description?: string                    // Optional description of the classification
}

export interface SubjectInfo {
    name: string                                        // Name of the subject
    id: SubjectId                                       // Unique identifier for the subject
    relatedSubjects?: ReadonlyArray<SubjectInfo>        // Optional array of related subjects
    details?: string                                    // Optional additional details about the subject
}

// Empty Classification constant
export const EmptyClassification: ProblemClassification = {
    id: 0,
    name: "",
    confidence: 0.0,
    subjects: [],
    description: undefined
}

export function isNullOrEmpty(classification: ProblemClassification | null | undefined): boolean {
    if(classification == null || classification == undefined)
        return true;

    if(classification.id != EmptyClassification.id)
        return false;

    if(classification.name != EmptyClassification.name)
        return false;

    if(classification.subjects && classification.subjects.length > 0)
        return false;

    // Description is optional and confidence is immaterial to content, omitting from null/empty check

    return true;
}

export function classificationFactory(name: string, confidence: number, description?: string, subjects: SubjectInfo[] = []): ProblemClassification {
    // Check valid inputs
    var valid = true;
    if(name == undefined || name.length == 0)
    {
        Log.log("Unable to assemble problem classification. Missing name", LogLevel.WARN);
        valid = false;
    }
    if(subjects == undefined || subjects.length == 0)
    {
        Log.log(`Unable to assemble problem classification for ${name}. Missing subjects`, LogLevel.WARN);
        valid = false;
    }

    if(!valid){
        return EmptyClassification;
    }

    // Clamp confidence
    if(confidence < 0)
        confidence = 0;
    if(confidence > 1)
        confidence = 1;
    
    // Generate a simple hash code for the name to use as an ID
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        const char = name.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    } 

    return {
        id: Math.abs(hash),
        name,
        confidence,
        subjects: subjects,
        description: description
    }
}

// Sample Problem Classifications
export const SampleClassifications: ProblemClassification[] = [
]

export const VariablesSubject: SubjectInfo = {
  id: SubjectId.Variables,
  name: "Variables",
  details: "Understanding symbols that represent numbers or values.",
};

export const ExpressionsSubject: SubjectInfo = {
  id: SubjectId.Expressions,
  name: "Expressions",
  relatedSubjects: [VariablesSubject],
  details: "Combining variables and numbers using operations.",
};

export const OrderOfOperationsSubject: SubjectInfo = {
  id: SubjectId.OrderOfOperations,
  name: "Order of Operations",
  relatedSubjects: [ExpressionsSubject],
  details: "Applying the correct sequence of operations (PEMDAS).",
};

export const LinearEquationsSubject: SubjectInfo = {
  id: SubjectId.LinearEquations,
  name: "Linear Equations",
  relatedSubjects: [VariablesSubject, ExpressionsSubject, OrderOfOperationsSubject],
  details: "Solving equations with one variable using balance methods.",
};

export const SlopeInterceptSubject: SubjectInfo = {
  id: SubjectId.SlopeIntercept,
  name: "Slope and Intercept",
  relatedSubjects: [LinearEquationsSubject],
  details: "Understanding slope, intercepts, and graphing linear equations.",
};

export const LinearFunctionsSubject: SubjectInfo = {
  id: SubjectId.LinearFunctions,
  name: "Linear Functions",
  relatedSubjects: [SlopeInterceptSubject],
  details: "Representing linear relationships and interpreting their graphs.",
};

export const LinearInequalitiesSubject: SubjectInfo = {
  id: SubjectId.LinearInequalities,
  name: "Linear Inequalities",
  relatedSubjects: [LinearEquationsSubject],
  details: "Solving and graphing linear inequalities and compound inequalities.",
};

export const SystemsOfEquationsSubject: SubjectInfo = {
  id: SubjectId.SystemsOfEquations,
  name: "Systems of Equations",
  relatedSubjects: [LinearFunctionsSubject, LinearEquationsSubject],
  details: "Solving multiple equations simultaneously (graphing, substitution, elimination).",
};

export const SystemsOfInequalitiesSubject: SubjectInfo = {
  id: SubjectId.SystemsOfInequalities,
  name: "Systems of Inequalities",
  relatedSubjects: [SystemsOfEquationsSubject, LinearInequalitiesSubject],
  details: "Solving and graphing systems with multiple inequalities.",
};

export const ExponentsSubject: SubjectInfo = {
  id: SubjectId.Exponents,
  name: "Exponents",
  relatedSubjects: [ExpressionsSubject],
  details: "Understanding powers, bases, and rules of exponents.",
};

export const ScientificNotationSubject: SubjectInfo = {
  id: SubjectId.ScientificNotation,
  name: "Scientific Notation",
  relatedSubjects: [ExponentsSubject],
  details: "Expressing large or small numbers using powers of ten.",
};

export const PolynomialsSubject: SubjectInfo = {
  id: SubjectId.Polynomials,
  name: "Polynomials",
  relatedSubjects: [ExpressionsSubject, ExponentsSubject],
  details: "Expressions with multiple terms and powers of variables.",
};

export const FactoringSubject: SubjectInfo = {
  id: SubjectId.Factoring,
  name: "Factoring",
  relatedSubjects: [PolynomialsSubject],
  details: "Breaking down polynomials into products of simpler expressions.",
};

export const CompletingTheSquareSubject: SubjectInfo = {
  id: SubjectId.CompletingTheSquare,
  name: "Completing the Square",
  relatedSubjects: [PolynomialsSubject, FactoringSubject],
  details: "A method for solving or rewriting quadratic equations.",
};

export const QuadraticFormulaSubject: SubjectInfo = {
  id: SubjectId.QuadraticFormula,
  name: "Quadratic Formula",
  relatedSubjects: [FactoringSubject, CompletingTheSquareSubject],
  details: "Using the quadratic formula to find roots of equations.",
};

export const QuadraticFunctionsSubject: SubjectInfo = {
  id: SubjectId.QuadraticFunctions,
  name: "Quadratic Functions",
  relatedSubjects: [PolynomialsSubject, ExponentsSubject, QuadraticFormulaSubject],
  details: "Functions involving x²; includes parabolas and their properties.",
};

export const AbsoluteValueSubject: SubjectInfo = {
  id: SubjectId.AbsoluteValue,
  name: "Absolute Value",
  relatedSubjects: [ExpressionsSubject, LinearEquationsSubject],
  details: "Understanding magnitude and solving absolute value equations.",
};

export const RadicalsSubject: SubjectInfo = {
  id: SubjectId.Radicals,
  name: "Radicals",
  relatedSubjects: [ExponentsSubject],
  details: "Working with square roots and other radical expressions.",
};

export const FunctionBasicsSubject: SubjectInfo = {
  id: SubjectId.FunctionBasics,
  name: "Function Basics",
  relatedSubjects: [ExpressionsSubject, VariablesSubject],
  details: "Defining functions and distinguishing inputs and outputs.",
};

export const DomainRangeSubject: SubjectInfo = {
  id: SubjectId.DomainRange,
  name: "Domain and Range",
  relatedSubjects: [FunctionBasicsSubject],
  details: "Identifying valid inputs and outputs of functions.",
};

export const PiecewiseSubject: SubjectInfo = {
  id: SubjectId.Piecewise,
  name: "Piecewise Functions",
  relatedSubjects: [FunctionBasicsSubject, DomainRangeSubject],
  details: "Functions defined by multiple sub-functions for different intervals.",
};

export const SequencesArithmeticSubject: SubjectInfo = {
  id: SubjectId.SequencesArithmetic,
  name: "Arithmetic Sequences",
  relatedSubjects: [LinearFunctionsSubject],
  details: "Number sequences with a constant difference between terms.",
};

export const FunctionsGeneralSubject: SubjectInfo = {
  id: SubjectId.FunctionsGeneral,
  name: "Functions (General)",
  relatedSubjects: [FunctionBasicsSubject, DomainRangeSubject],
  details: "General study of functions, notation, and mappings.",
};

/* ---------- Collection ---------- */

export const AllSubjects: ReadonlyArray<SubjectInfo> = [
  VariablesSubject,
  ExpressionsSubject,
  OrderOfOperationsSubject,
  LinearEquationsSubject,
  LinearInequalitiesSubject,
  SystemsOfEquationsSubject,
  SystemsOfInequalitiesSubject,
  SlopeInterceptSubject,
  LinearFunctionsSubject,
  FunctionBasicsSubject,
  FunctionsGeneralSubject,
  DomainRangeSubject,
  PiecewiseSubject,
  ExponentsSubject,
  ScientificNotationSubject,
  PolynomialsSubject,
  FactoringSubject,
  CompletingTheSquareSubject,
  QuadraticFormulaSubject,
  QuadraticFunctionsSubject,
  AbsoluteValueSubject,
  RadicalsSubject,
  SequencesArithmeticSubject,
];