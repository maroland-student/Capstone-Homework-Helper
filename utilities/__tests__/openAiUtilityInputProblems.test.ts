import { OpenAI } from 'openai';
import { OpenAIHandler } from '../../utilities/openAiUtility';

jest.mock('openai');

jest.mock('../../server/utilities/toggle_logs', () => ({
  __esModule: true,
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

describe('OpenAIHandler', () => {
  let mockCreate: jest.Mock;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    mockCreate = jest.fn();
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    } as any));
  });

  describe('generateText', () => {
    it('should generate text successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'This is a test response',
            },
          },
        ],
      };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await OpenAIHandler.generateText('Test prompt');

      expect(result).toBe('This is a test response');
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Test prompt' },
        ],
      });
    });

    it('should handle empty response content', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await OpenAIHandler.generateText('Test prompt');

      expect(result).toBe('');
    });

    it('should handle errors gracefully', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'));

      const result = await OpenAIHandler.generateText('Test prompt');

      expect(result).toBe('Error generating text.');
    });

    it('should trim whitespace from response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '  Response with whitespace  \n',
            },
          },
        ],
      };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await OpenAIHandler.generateText('Test prompt');

      expect(result).toBe('Response with whitespace');
    });
  });

  describe('generateAlgebra1Problem', () => {
    it('should generate an algebra problem successfully', async () => {
      const mockProblem = 'A car travels at 60 mph for 3 hours. How far does it travel?';
      const mockResponse = {
        choices: [
          {
            message: {
              content: mockProblem,
            },
          },
        ],
      };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await OpenAIHandler.generateAlgebra1Problem();

      expect(result).toBe(mockProblem);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          temperature: 0.8,
        })
      );
    });

    it('should request problems about various algebra topics', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Problem text' } }],
      };
      mockCreate.mockResolvedValue(mockResponse);

      await OpenAIHandler.generateAlgebra1Problem();

      const callArgs = mockCreate.mock.calls[0][0];
      const userMessage = callArgs.messages[1].content;

      // Verify the prompt includes topic selection
      expect(userMessage).toContain('Generate a single Algebra 1 word problem');
    });

    it('should handle errors and return error message', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'));

      const result = await OpenAIHandler.generateAlgebra1Problem();

      expect(result).toBe('Error generating math problem.');
    });
  });

  describe('extractEquation', () => {
    it('should extract equation from linear problem', async () => {
      const problemText = 'A phone plan costs $25 per month plus $0.10 per text message.';
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                equation: 'C = b + rt',
                substitutedEquation: 'C = 25 + 0.10t',
                variables: ['base cost b = 25', 'rate per text r = 0.10'],
              }),
            },
          },
        ],
      };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await OpenAIHandler.extractEquation(problemText);

      expect(result.equation).toBe('C = b + rt');
      expect(result.substitutedEquation).toBe('C = 25 + 0.10t');
      expect(result.variables).toHaveLength(2);
      expect(result.variables[0]).toBe('base cost b = 25');
    });

    it('should extract system of equations', async () => {
      const problemText = 'Adult tickets cost $12, child tickets cost $8. Total tickets: 85, revenue: $820.';
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                equation: 'x + y = total, ax + by = cost',
                substitutedEquation: 'x + y = 85, 12x + 8y = 820',
                variables: [],
              }),
            },
          },
        ],
      };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await OpenAIHandler.extractEquation(problemText);

      expect(result.equation).toBe('x + y = total, ax + by = cost');
      expect(result.substitutedEquation).toBe('x + y = 85, 12x + 8y = 820');
      expect(result.variables).toEqual([]);
    });

    it('should clean unwanted text from equations', async () => {
      const problemText = 'Distance problem';
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                equation: 'd = text r text and t',
                substitutedEquation: 'd = 60 * 3',
                variables: ['rate r = 60', 'time t = 3'],
              }),
            },
          },
        ],
      };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await OpenAIHandler.extractEquation(problemText);

      expect(result.equation).toBe('d = r t');
    });

    it('should handle array format for variables', async () => {
      const problemText = 'Test problem';
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                equation: 'y = mx + b',
                substitutedEquation: 'y = 4x + 30',
                variables: ['slope m = 4', 'y-intercept b = 30'],
              }),
            },
          },
        ],
      };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await OpenAIHandler.extractEquation(problemText);

      expect(Array.isArray(result.variables)).toBe(true);
      expect(result.variables).toHaveLength(2);
    });

    it('should handle legacy object format for variables', async () => {
      const problemText = 'Test problem';
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                equation: 'y = mx + b',
                substitutedEquation: 'y = 4x + 30',
                variables: { m: 4, b: 30 },
              }),
            },
          },
        ],
      };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await OpenAIHandler.extractEquation(problemText);

      expect(Array.isArray(result.variables)).toBe(true);
      expect(result.variables).toContain('4 m');
      expect(result.variables).toContain('30 b');
    });

    it('should filter out null and undefined variables', async () => {
      const problemText = 'Test problem';
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                equation: 'y = mx + b',
                substitutedEquation: 'y = 4x + 30',
                variables: ['slope m = 4', null, undefined, '', 'y-intercept b = 30'],
              }),
            },
          },
        ],
      };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await OpenAIHandler.extractEquation(problemText);

      expect(result.variables).toHaveLength(2);
      expect(result.variables).not.toContain(null);
      expect(result.variables).not.toContain(undefined);
      expect(result.variables).not.toContain('');
    });

    it('should derive template when equation equals substitutedEquation', async () => {
      const problemText = 'Linear equation problem';
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                equation: 'y = 4x + 30',
                substitutedEquation: 'y = 4x + 30',
                variables: [],
              }),
            },
          },
        ],
      };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await OpenAIHandler.extractEquation(problemText);

      // Should derive template from substituted equation
      expect(result.equation).not.toBe('y = 4x + 30');
      expect(result.equation).toContain('mx');
      expect(result.equation).toContain('b');
    });

    it('should handle invalid JSON response', async () => {
      const problemText = 'Test problem';
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'This is not valid JSON',
            },
          },
        ],
      };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await OpenAIHandler.extractEquation(problemText);

      expect(result.equation).toBe('');
      expect(result.substitutedEquation).toBe('');
      expect(result.variables).toEqual([]);
    });

    it('should handle empty response', async () => {
      const problemText = 'Test problem';
      const mockResponse = {
        choices: [
          {
            message: {
              content: '{}',
            },
          },
        ],
      };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await OpenAIHandler.extractEquation(problemText);

      expect(result.equation).toBe('');
      expect(result.substitutedEquation).toBe('');
      expect(result.variables).toEqual([]);
    });

    it('should handle API errors', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'));

      const result = await OpenAIHandler.extractEquation('Test problem');

      expect(result.equation).toBe('');
      expect(result.substitutedEquation).toBe('');
      expect(result.variables).toEqual([]);
    });

    it('should use temperature 0.3 for consistent extraction', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                equation: 'y = mx + b',
                substitutedEquation: 'y = 4x + 30',
                variables: [],
              }),
            },
          },
        ],
      };
      mockCreate.mockResolvedValue(mockResponse);

      await OpenAIHandler.extractEquation('Test problem');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.3,
        })
      );
    });

    it('should request JSON response format', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                equation: 'y = mx + b',
                substitutedEquation: 'y = 4x + 30',
                variables: [],
              }),
            },
          },
        ],
      };
      mockCreate.mockResolvedValue(mockResponse);

      await OpenAIHandler.extractEquation('Test problem');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          response_format: { type: 'json_object' },
        })
      );
    });

    it('should include enhanced prompt engineering in system message', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                equation: 'y = mx + b',
                substitutedEquation: 'y = 4x + 30',
                variables: [],
              }),
            },
          },
        ],
      };
      mockCreate.mockResolvedValue(mockResponse);

      await OpenAIHandler.extractEquation('Test problem');

      const callArgs = mockCreate.mock.calls[0][0];
      const systemMessage = callArgs.messages[0].content;

      expect(systemMessage).toContain('expert mathematics equation extraction specialist');
      expect(systemMessage).toContain('CORE COMPETENCIES');
    });

    it('should include step-by-step process in user prompt', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                equation: 'y = mx + b',
                substitutedEquation: 'y = 4x + 30',
                variables: [],
              }),
            },
          },
        ],
      };
      mockCreate.mockResolvedValue(mockResponse);

      await OpenAIHandler.extractEquation('Test problem');

      const callArgs = mockCreate.mock.calls[0][0];
      const userMessage = callArgs.messages[1].content;

      expect(userMessage).toContain('STEP 1: IDENTIFY THE FORMULA TYPE');
      expect(userMessage).toContain('STEP 2: WRITE THE GENERIC TEMPLATE');
      expect(userMessage).toContain('STEP 3: SUBSTITUTE VALUES');
      expect(userMessage).toContain('STEP 4: LIST THE VARIABLES');
    });
  });

  describe('generateFromImage', () => {
    it('should generate text from image successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'This image shows a mathematical equation',
            },
          },
        ],
      };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await OpenAIHandler.generateFromImage(
        'Describe this image',
        'base64encodedimage'
      );

      expect(result).toBe('This image shows a mathematical equation');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.arrayContaining([
                { type: 'text', text: 'Describe this image' },
                expect.objectContaining({
                  type: 'image_url',
                  image_url: {
                    url: 'data:image/jpeg;base64,base64encodedimage',
                  },
                }),
              ]),
            }),
          ]),
        })
      );
    });

    it('should handle errors in image processing', async () => {
      mockCreate.mockRejectedValue(new Error('Image processing error'));

      const result = await OpenAIHandler.generateFromImage('Test', 'base64');

      expect(result).toBe('Error generating text.');
    });
  });
});