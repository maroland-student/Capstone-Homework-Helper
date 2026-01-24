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

jest.mock('../../server/utilities/toggle_logs', () => {
  const mockLog = jest.fn();
  return {
    __esModule: true,
    default: {
      log: mockLog,
      LogLevel: {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        CRITICAL: 3,
      },
    },
    LogLevel: {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      CRITICAL: 3,
    },
    log: mockLog,
  };
});

import { OpenAIHandler } from '../openAiUtility';

process.env.EXPO_PUBLIC_OPENAI_API_KEY = 'test-key';
process.env.EXPO_PUBLIC_OPENAI_ALLOW_BROWSER = 'true';

const mockOpenAI = require('openai');
let mockCreate: jest.Mock;

beforeEach(() => {
  mockCreate = jest.fn();
  mockOpenAI.OpenAI.mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

describe('generateStepCheckpoints', () => {
  it('should generate valid step checkpoints for linear equation', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            targetVariable: 'x',
            startEquation: '100 = 25 + 0.15x',
            steps: [
              { instruction: 'Subtract 25 from both sides', checkpoint: '75 = 0.15x' },
              { instruction: 'Divide both sides by 0.15', checkpoint: '500 = x' }
            ],
            finalAnswer: 'x = 500'
          })
        }
      }]
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await OpenAIHandler.generateStepCheckpoints(
      'A taxi charges $25 plus $0.15 per mile. If the total cost is $100, how many miles?',
      '100 = 25 + 0.15x'
    );

    expect(result.targetVariable).toBe('x');
    expect(result.startEquation).toBe('100 = 25 + 0.15x');
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].instruction).toBe('Subtract 25 from both sides');
    expect(result.steps[0].checkpoint).toBe('75 = 0.15x');
    expect(result.steps[1].instruction).toBe('Divide both sides by 0.15');
    expect(result.steps[1].checkpoint).toBe('500 = x');
    expect(result.finalAnswer).toBe('x = 500');
  });

  it('should handle system of equations', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            targetVariable: 'x,y',
            startEquation: 'x + y = 10, 2x - y = 5',
            steps: [
              { instruction: 'Add the equations', checkpoint: '3x = 15' },
              { instruction: 'Divide by 3', checkpoint: 'x = 5' },
              { instruction: 'Substitute x into first equation', checkpoint: '5 + y = 10' },
              { instruction: 'Subtract 5', checkpoint: 'y = 5' }
            ],
            finalAnswer: 'x = 5, y = 5'
          })
        }
      }]
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await OpenAIHandler.generateStepCheckpoints(
      'Find two numbers that sum to 10 and where twice the first minus the second equals 5',
      'x + y = 10, 2x - y = 5'
    );

    expect(result.targetVariable).toBe('x,y');
    expect(result.steps).toHaveLength(4);
    expect(result.steps[0].checkpoint).toContain('=');
  });

  it('should handle inequalities', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            targetVariable: 'x',
            startEquation: '2x + 5 > 15',
            steps: [
              { instruction: 'Subtract 5 from both sides', checkpoint: '2x > 10' },
              { instruction: 'Divide both sides by 2', checkpoint: 'x > 5' }
            ],
            finalAnswer: 'x > 5'
          })
        }
      }]
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await OpenAIHandler.generateStepCheckpoints(
      'Solve 2x + 5 > 15',
      '2x + 5 > 15'
    );

    expect(result.steps).toHaveLength(2);
    expect(result.steps[1].checkpoint).toContain('>');
  });

  it('should filter out invalid steps', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            targetVariable: 'x',
            startEquation: '2x = 10',
            steps: [
              { instruction: 'Divide by 2', checkpoint: 'x = 5' },
              { instruction: 'Invalid step', checkpoint: '' },
              { instruction: 'Another step', checkpoint: 'x = 5' }
            ],
            finalAnswer: 'x = 5'
          })
        }
      }]
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await OpenAIHandler.generateStepCheckpoints(
      'Solve 2x = 10',
      '2x = 10'
    );

    expect(result.steps.length).toBeLessThanOrEqual(2);
    expect(result.steps.every(s => s.checkpoint.length > 0)).toBe(true);
  });

  it('should limit steps to 8', async () => {
    const manySteps = Array.from({ length: 10 }, (_, i) => ({
      instruction: `Step ${i + 1}`,
      checkpoint: `x = ${i + 1}`
    }));
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            targetVariable: 'x',
            startEquation: 'x = 1',
            steps: manySteps,
            finalAnswer: 'x = 10'
          })
        }
      }]
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await OpenAIHandler.generateStepCheckpoints(
      'Test problem',
      'x = 1'
    );

    expect(result.steps.length).toBeLessThanOrEqual(8);
  });

  it('should handle markdown wrapped JSON response', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: '```json\n' + JSON.stringify({
            targetVariable: 'x',
            startEquation: '2x = 10',
            steps: [
              { instruction: 'Divide by 2', checkpoint: 'x = 5' }
            ],
            finalAnswer: 'x = 5'
          }) + '\n```'
        }
      }]
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await OpenAIHandler.generateStepCheckpoints(
      'Solve 2x = 10',
      '2x = 10'
    );

    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].checkpoint).toBe('x = 5');
  });

  it('should return empty steps on error', async () => {
    mockCreate.mockRejectedValue(new Error('API error'));

    const result = await OpenAIHandler.generateStepCheckpoints(
      'Test problem',
      '2x = 10'
    );

    expect(result.steps).toHaveLength(0);
    expect(result.targetVariable).toBe('x');
    expect(result.startEquation).toBe('2x = 10');
  });

  it('should validate checkpoint syntax and filter invalid', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            targetVariable: 'x',
            startEquation: '2x = 10',
            steps: [
              { instruction: 'Valid step', checkpoint: 'x = 5' },
              { instruction: 'Missing equals', checkpoint: 'x 5' },
              { instruction: 'Unbalanced parens', checkpoint: 'x = (5 + 3' }
            ],
            finalAnswer: 'x = 5'
          })
        }
      }]
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await OpenAIHandler.generateStepCheckpoints(
      'Test',
      '2x = 10'
    );

    expect(result.steps.length).toBeLessThanOrEqual(1);
    if (result.steps.length > 0) {
      expect(result.steps[0].checkpoint).toContain('=');
    }
  });

  it('should handle empty steps array from AI', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            targetVariable: 'x',
            startEquation: 'invalid equation',
            steps: [],
            finalAnswer: ''
          })
        }
      }]
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await OpenAIHandler.generateStepCheckpoints(
      'Unsolvable problem',
      'invalid equation'
    );

    expect(result.steps).toHaveLength(0);
  });

  it('should use default values when AI response is malformed', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            targetVariable: null,
            startEquation: null,
            steps: null,
            finalAnswer: null
          })
        }
      }]
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await OpenAIHandler.generateStepCheckpoints(
      'Test',
      '2x = 10'
    );

    expect(result.targetVariable).toBe('x');
    expect(result.startEquation).toBe('2x = 10');
    expect(result.steps).toHaveLength(0);
    expect(result.finalAnswer).toBe('');
  });
});

describe('gradeStepAttempt', () => {
  it('should grade correct step attempt', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            correct: true,
            feedback: 'Correct! You correctly subtracted 25 from both sides.'
          })
        }
      }]
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await OpenAIHandler.gradeStepAttempt({
      startEquation: '100 = 25 + 0.15x',
      targetVariable: 'x',
      stepInstruction: 'Subtract 25 from both sides',
      expectedCheckpoint: '75 = 0.15x',
      studentInput: '75 = 0.15x'
    });

    expect(result.correct).toBe(true);
    expect(result.feedback).toContain('Correct');
  });

  it('should grade incorrect step attempt', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            correct: false,
            feedback: 'Incorrect. You should subtract 25, not add it.'
          })
        }
      }]
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await OpenAIHandler.gradeStepAttempt({
      startEquation: '100 = 25 + 0.15x',
      targetVariable: 'x',
      stepInstruction: 'Subtract 25 from both sides',
      expectedCheckpoint: '75 = 0.15x',
      studentInput: '125 = 0.15x'
    });

    expect(result.correct).toBe(false);
    expect(result.feedback).toBeTruthy();
  });

  it('should accept equivalent rearrangements', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            correct: true,
            feedback: 'Correct! Equivalent form.'
          })
        }
      }]
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await OpenAIHandler.gradeStepAttempt({
      startEquation: '2x = 10',
      targetVariable: 'x',
      stepInstruction: 'Divide both sides by 2',
      expectedCheckpoint: 'x = 5',
      studentInput: '5 = x'
    });

    expect(result.correct).toBe(true);
  });

  it('should handle system of equations', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            correct: true,
            feedback: 'Correct!'
          })
        }
      }]
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await OpenAIHandler.gradeStepAttempt({
      startEquation: 'x + y = 10, 2x - y = 5',
      targetVariable: 'x,y',
      stepInstruction: 'Add the equations',
      expectedCheckpoint: '3x = 15',
      studentInput: '3x = 15'
    });

    expect(result.correct).toBe(true);
  });

  it('should handle inequalities with correct direction', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            correct: false,
            feedback: 'Incorrect. The inequality direction is wrong.'
          })
        }
      }]
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await OpenAIHandler.gradeStepAttempt({
      startEquation: '2x + 5 > 15',
      targetVariable: 'x',
      stepInstruction: 'Subtract 5 and divide by 2',
      expectedCheckpoint: 'x > 5',
      studentInput: 'x < 5'
    });

    expect(result.correct).toBe(false);
  });

  it('should handle markdown wrapped JSON', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: '```json\n' + JSON.stringify({
            correct: true,
            feedback: 'Correct'
          }) + '\n```'
        }
      }]
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await OpenAIHandler.gradeStepAttempt({
      startEquation: '2x = 10',
      targetVariable: 'x',
      stepInstruction: 'Divide by 2',
      expectedCheckpoint: 'x = 5',
      studentInput: 'x = 5'
    });

    expect(result.correct).toBe(true);
  });

  it('should return safe default on parse error', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: 'invalid json {'
        }
      }]
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await OpenAIHandler.gradeStepAttempt({
      startEquation: '2x = 10',
      targetVariable: 'x',
      stepInstruction: 'Divide by 2',
      expectedCheckpoint: 'x = 5',
      studentInput: 'x = 5'
    });

    expect(result.correct).toBe(false);
    expect(result.feedback).toContain('try again');
  });

  it('should handle invalid response structure', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify([])
        }
      }]
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await OpenAIHandler.gradeStepAttempt({
      startEquation: '2x = 10',
      targetVariable: 'x',
      stepInstruction: 'Divide by 2',
      expectedCheckpoint: 'x = 5',
      studentInput: 'x = 5'
    });

    expect(result.correct).toBe(false);
  });

  it('should provide default feedback when missing', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            correct: true
          })
        }
      }]
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await OpenAIHandler.gradeStepAttempt({
      startEquation: '2x = 10',
      targetVariable: 'x',
      stepInstruction: 'Divide by 2',
      expectedCheckpoint: 'x = 5',
      studentInput: 'x = 5'
    });

    expect(result.correct).toBe(true);
    expect(result.feedback).toBe('Correct.');
  });

  it('should handle API errors gracefully', async () => {
    mockCreate.mockRejectedValue(new Error('Network error'));

    const result = await OpenAIHandler.gradeStepAttempt({
      startEquation: '2x = 10',
      targetVariable: 'x',
      stepInstruction: 'Divide by 2',
      expectedCheckpoint: 'x = 5',
      studentInput: 'x = 5'
    });

    expect(result.correct).toBe(false);
    expect(result.feedback).toContain('try again');
  });
});

describe('validateStepCheckpointsSync', () => {
  it('should validate steps with equals signs', () => {
    const steps = [
      { instruction: 'Step 1', checkpoint: '2x = 10' },
      { instruction: 'Step 2', checkpoint: 'x = 5' }
    ];
    const result = (OpenAIHandler as any).validateStepCheckpointsSync('3x = 15', steps);
    expect(result).toHaveLength(2);
  });

  it('should validate steps with inequality signs', () => {
    const steps = [
      { instruction: 'Step 1', checkpoint: '2x > 10' },
      { instruction: 'Step 2', checkpoint: 'x > 5' }
    ];
    const result = (OpenAIHandler as any).validateStepCheckpointsSync('2x + 5 > 15', steps);
    expect(result).toHaveLength(2);
  });

  it('should filter steps missing equals or inequality', () => {
    const steps = [
      { instruction: 'Step 1', checkpoint: '2x = 10' },
      { instruction: 'Step 2', checkpoint: 'x 5' },
      { instruction: 'Step 3', checkpoint: 'x = 5' }
    ];
    const result = (OpenAIHandler as any).validateStepCheckpointsSync('3x = 15', steps);
    expect(result.length).toBeLessThan(3);
    expect(result.every((s: { instruction: string; checkpoint: string }) => s.checkpoint.includes('=') || /[<>≤≥]/.test(s.checkpoint))).toBe(true);
  });

  it('should filter steps with unbalanced parentheses', () => {
    const steps = [
      { instruction: 'Step 1', checkpoint: '2(x + 3) = 10' },
      { instruction: 'Step 2', checkpoint: 'x + 3 = (5' },
      { instruction: 'Step 3', checkpoint: 'x = 2' }
    ];
    const result = (OpenAIHandler as any).validateStepCheckpointsSync('2(x + 3) = 10', steps);
    expect(result.length).toBeLessThan(3);
    expect(result.every((s: { instruction: string; checkpoint: string }) => {
      const open = (s.checkpoint.match(/\(/g) || []).length;
      const close = (s.checkpoint.match(/\)/g) || []).length;
      return open === close;
    })).toBe(true);
  });

  it('should return empty array for empty input', () => {
    const result = (OpenAIHandler as any).validateStepCheckpointsSync('2x = 10', []);
    expect(result).toHaveLength(0);
  });

  it('should handle steps with multiple inequality types', () => {
    const steps = [
      { instruction: 'Step 1', checkpoint: 'x ≥ 5' },
      { instruction: 'Step 2', checkpoint: 'x ≤ 10' },
      { instruction: 'Step 3', checkpoint: 'x < 15' }
    ];
    const result = (OpenAIHandler as any).validateStepCheckpointsSync('x + 5 ≥ 10', steps);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should stop at first invalid step', () => {
    const steps = [
      { instruction: 'Step 1', checkpoint: '2x = 10' },
      { instruction: 'Step 2', checkpoint: 'invalid' },
      { instruction: 'Step 3', checkpoint: 'x = 5' }
    ];
    const result = (OpenAIHandler as any).validateStepCheckpointsSync('3x = 15', steps);
    expect(result.length).toBe(1);
    expect(result[0].checkpoint).toBe('2x = 10');
  });

  it('should handle complex equations with parentheses', () => {
    const steps = [
      { instruction: 'Step 1', checkpoint: '2(x + 3) = 10' },
      { instruction: 'Step 2', checkpoint: 'x + 3 = 5' },
      { instruction: 'Step 3', checkpoint: 'x = 2' }
    ];
    const result = (OpenAIHandler as any).validateStepCheckpointsSync('2(x + 3) = 10', steps);
    expect(result).toHaveLength(3);
  });

  it('should handle system of equations format', () => {
    const steps = [
      { instruction: 'Step 1', checkpoint: 'x + y = 10, 2x - y = 5' },
      { instruction: 'Step 2', checkpoint: '3x = 15' }
    ];
    const result = (OpenAIHandler as any).validateStepCheckpointsSync('x + y = 10, 2x - y = 5', steps);
    expect(result.length).toBeGreaterThan(0);
  });
});
