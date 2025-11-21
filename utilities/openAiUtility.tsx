// utilities/openAiUtility.tsx

import { OpenAI } from "openai";
import openAIQueryParams from '../server/models/openai-query';
import ToggleLogs, { LogLevel } from '../server/utilities/toggle_logs';
import { getTopicById } from './topicsLoader';

/**
 * Creates a singleton instance of the OpenAI client configured with the API key.
 */
const ai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: process.env.EXPO_PUBLIC_OPENAI_ALLOW_BROWSER === "true",
});


export class OpenAIHandler {

  public static async generate(prompt: string, params: openAIQueryParams): Promise<string> {
    ToggleLogs.log("Processing OpenAI request with params:\n" + JSON.stringify(params), LogLevel.INFO);

    // Build body
    const body: any = {}
    body.messages = [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt },
    ];

    if (params?.background != undefined)
      body.background = params.background;

    if (params?.conversation != undefined)
      body.conversation = params.conversation;

    if (params?.include != undefined)
      body.include = params.include;

    if (params?.input != undefined)
      body.input = params.input;

    if (params?.instructions != undefined)
      body.instructions = params.instructions;

    if (params?.max_output_tokens != undefined)
      body.max_output_tokens = params.max_output_tokens;

    if (params?.max_tool_calls != undefined)
      body.max_tool_calls = params.max_tool_calls;

    if (params?.model != undefined)
      body.model = params.model;

    if (params?.parallel_tool_calls != undefined)
      body.parallel_tool_calls = params.parallel_tool_calls;

    if (params?.previous_response_id != undefined)
      body.previous_response_id = params.previous_response_id;

    if (params?.prompt != undefined)
      body.prompt = params.prompt;

    if (params?.prompt_cache_key != undefined)
      body.prompt_cache_key = params.prompt_cache_key;

    if (params?.reasoning != undefined)
      body.reasoning = params.reasoning;

    if (params?.safety_identifier != undefined)
      body.safety_identifier = params.safety_identifier;

    if (params?.service_tier != undefined)
      body.service_tier = params.service_tier;

    if (params?.store != undefined)
      body.store = params.store;

    if (params?.stream != undefined)
      body.stream = params.stream;

    if (params?.stream_options != undefined)
      body.stream_options = params.stream_options;

    if (params?.temperature != undefined)
      body.temperature = params.temperature;

    if (params?.text != undefined)
      body.text = params.text;

    if (params?.tool_choice != undefined)
      body.tool_choice = params.tool_choice;

    if (params?.tools != undefined)
      body.tools = params.tools;

    if (params?.top_logprobs != undefined)
      body.top_logprobs = params.top_logprobs;

    if (params?.top_p != undefined)
      body.top_p = params.top_p;

    if (params?.truncation != undefined)
      body.truncation = params.truncation;

    // Send
    try {
      const response = await ai.chat.completions.create(body);

      const text = response.choices[0]?.message?.content ?? "";
      return text.trim();
    } catch (err) {
      ToggleLogs.log("Error generating text: " + err, LogLevel.CRITICAL);
      return "Error generating text.";
    }
  }

  /**
   * Generates a query from a text prompt
   * @param prompt 
   * @returns 
   */
  public static async generateText(prompt: string): Promise<string> {
    try {
      const response = await ai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
      });

      const text = response.choices[0]?.message?.content ?? "";
      return text.trim();
    } catch (err) {
      ToggleLogs.log("Error generating text: " + err, LogLevel.CRITICAL);
      return "Error generating text.";
    }
  }

  public static async generateFromImage(prompt: string, image: string): Promise<string> {
    try {
      const response = await ai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image}`,
                },
              },
            ],
          },
        ],
      });

      const text = response.choices[0]?.message?.content ?? "";
      return text.trim();
    } catch (err) {
      ToggleLogs.log("Error generating text: " + err, LogLevel.CRITICAL);
      return "Error generating text.";
    }

    /**
     * Generates an Algebra 1 word problem covering various topics
     * @returns A string containing the generated word problem
     * @deprecated Use generateMathProblem instead
     */
    public static async generateAlgebra1Problem(): Promise<string> {
        return this.generateMathProblem([]);
    }

    /**
     * Generates a math word problem based on selected topic IDs
     * @param topicIds Array of topic IDs to generate problems for. If empty, generates a general Algebra 1 problem.
     * @returns A string containing the generated word problem
     */
    public static async generateMathProblem(topicIds: string[]): Promise<string> {
        try {
            let topicDescriptions: string[] = [];
            
            if (topicIds.length > 0) {
                for (const topicId of topicIds) {
                    const topicInfo = getTopicById(topicId);
                    if (topicInfo) {
                        topicDescriptions.push(`${topicInfo.topic.name} (from ${topicInfo.category.name})`);
                    }
                }
            }
            
            if (topicDescriptions.length === 0) {
                topicDescriptions = [
                    "linear equations in slope-intercept form (y = mx + b)",
                    "linear equations in point-slope form",
                    "linear equations in standard form (Ax + By = C)",
                    "finding slope from two points",
                    "finding slope from a graph",
                    "parallel and perpendicular lines",
                    "quadratic equations and parabolas",
                    "factoring quadratic expressions",
                    "solving quadratic equations by factoring",
                    "quadratic formula",
                    "completing the square",
                    "systems of linear equations",
                    "solving systems by substitution",
                    "solving systems by elimination",
                    "linear inequalities",
                    "systems of inequalities",
                    "polynomials (addition, subtraction, multiplication)",
                    "factoring polynomials",
                    "exponential functions",
                    "absolute value equations",
                    "rational expressions",
                    "radical expressions"
                ];
            }
            
            const selectedTopic = topicDescriptions[Math.floor(Math.random() * topicDescriptions.length)];

            const prompt = `Generate a single Algebra 1 word problem about ${selectedTopic}. 
The problem should:
- Be appropriate for Algebra 1 students
- Be a real-world scenario or application
- Include all necessary information to solve the problem
- Use clear, age-appropriate language
- Return only the problem text, no solutions, explanations, or equations in the problem text itself (the equation will be extracted separately)

Example format: "A car rental company charges a base fee of $25 plus $0.15 per mile driven. If you have a budget of $100, how many miles can you drive?"

Do NOT include equations like "y = mx + b" or "y = 25 + 0.15x" in the problem text itself - just describe the scenario.`;

            const response = await ai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { 
                        role: "system", 
                        content: "You are a helpful math teacher that creates Algebra 1 word problems. You create engaging, real-world problems that help students understand mathematical concepts." 
                    },
                    { role: "user", content: prompt },
                ],
                temperature: 0.8,
            });

            const text = response.choices[0]?.message?.content ?? "";
            return text.trim();
        } catch (err) {
            ToggleLogs.log("Error generating math problem: " + err, LogLevel.CRITICAL);
            return "Error generating math problem.";
        }
    }
  }

  /**
   * Extracts equations and variable values from an algebra problem with enhanced prompt engineering
   * @param problemText The text of the algebra problem
   * @returns An object containing the basic formula, substituted equation, and extracted variable notes
   */
  public static async extractEquation(problemText: string): Promise<{
    equation: string;           // Basic formula template (e.g., "y = mx + b", "A = lw", "d = rt")
    substitutedEquation: string; // Equation with substituted values (e.g., "y = 4x + 30")
    variables: string[]; // Simple text list of extracted facts (e.g., ["tickets are $5 each", "base fee is $10"])
  }> {
    try {
      const systemPrompt = `You are an expert mathematics equation extraction specialist with deep knowledge of Algebra 1 concepts. Your job is to analyze word problems and extract their mathematical structure in a precise, standardized format.

CORE COMPETENCIES:
1. Pattern Recognition: Identify the underlying mathematical formula type (linear, quadratic, system, etc.)
2. Variable Abstraction: Distinguish between generic formula templates and specific numeric instances
3. Value Extraction: Accurately identify and label all numeric values from the problem context
4. Format Standardization: Output clean, consistent mathematical notation

YOUR RESPONSE MUST BE VALID JSON with exactly three fields: equation, substitutedEquation, and variables.`;

      const userPrompt = `TASK: Extract the mathematical equation structure from this algebra problem.

PROBLEM TEXT:
"${problemText}"

STEP-BY-STEP EXTRACTION PROCESS:

STEP 1: IDENTIFY THE FORMULA TYPE
Ask yourself: What type of mathematical relationship is this?
- Linear relationship? (y = mx + b format)
- Area/Perimeter? (A = lw, P = 2l + 2w)
- Distance/Rate/Time? (d = rt)
- System of equations? (multiple equations with same variables)
- Quadratic? (y = ax² + bx + c)
- Other standard formula?

STEP 2: WRITE THE GENERIC TEMPLATE ("equation" field)
This is the ABSTRACT FORMULA with VARIABLE LETTERS ONLY:
CORRECT: "y = mx + b" (uses generic variables m and b)
CORRECT: "d = rt" (uses generic variables r and t)
CORRECT: "x + y = total, ax + by = cost" (for systems)
WRONG: "y = 4x + 30" (contains specific numbers - this belongs in substitutedEquation)
WRONG: "C = 25 + 0.15m" (mixing generic C with specific numbers)

RULES FOR TEMPLATE:
- Use standard algebraic variable names (m for slope, b for y-intercept, r for rate, t for time, etc.)
- NO numeric values from the problem
- Use descriptive names when helpful: "total", "cost", "distance", "rate", "time"
- For systems: Use comma-separated equations, NOT LaTeX \begin{cases}

STEP 3: SUBSTITUTE VALUES ("substitutedEquation" field)
Replace EVERY variable in the template with its ACTUAL NUMERIC VALUE from the problem:
CORRECT: "y = 4x + 30" (if slope=4, intercept=30)
CORRECT: "d = 65t" (if rate=65)
CORRECT: "x + y = 85, 12x + 8y = 820" (for systems with these values)
WRONG: "y = mx + 30" (still has variable m instead of a number)
WRONG: Same as template (must be different - must have numbers!)

CRITICAL: substitutedEquation must look DIFFERENT from equation because numbers replace variables!

STEP 4: LIST THE VARIABLES ("variables" field)
Create a simple array of strings describing what each number represents:
Format: ["description variable = value", "description variable = value", ...]

Examples:
- ["slope m = 4", "y-intercept b = 30"]
- ["rate r = 65 mph", "time t = 3 hours"]
- ["cost per adult ticket a = 12", "cost per child ticket c = 8"]

For systems where x and y are unknowns (not given values): use empty array []

OUTPUT FORMAT REQUIREMENTS:

Return ONLY valid JSON (no markdown, no code blocks, no explanations):

{
  "equation": "<generic template with variable letters>",
  "substitutedEquation": "<same structure but with actual numbers>",
  "variables": ["<description var = value>", "<description var = value>"]
}

QUALITY CHECKLIST before responding:
1. equation contains NO numbers from the problem (only variable letters)
2. substitutedEquation contains the SAME structure but with numbers substituted
3. equation and substitutedEquation look DIFFERENT (one has letters, one has numbers)
4. variables array lists what each number represents in clear language
5. NO LaTeX commands like \begin{cases}, \text{}, etc.
6. For systems: use simple comma-separated format
7. Response is valid JSON only (no extra text)

    /**
     * Extracts equations and variable values from an algebra problem
     * @param problemText The text of the algebra problem
     * @returns An object containing the basic formula, substituted equation, and extracted variable notes
     */
    public static async extractEquation(problemText: string): Promise<{
        equation: string;           // Basic formula template (e.g., "y = mx + b", "A = lw", "d = rt")
        substitutedEquation: string; // Equation with substituted values (e.g., "y = 4x + 30")
        variables: string[]; // Simple text list of extracted facts (e.g., ["tickets are $5 each", "base fee is $10"])
    }> {
        try {
            const prompt = `Extract the equation from this algebra problem.

Problem: "${problemText}"

INSTRUCTIONS:
1. Identify the BASIC FORMULA (like "y = mx + b" for linear, "A = lw" for area, "d = rt" for distance)
2. Create the SUBSTITUTED EQUATION with actual values from the problem
3. Extract variable values from the substituted equation and list them simply

Return ONLY a valid JSON object with this EXACT structure:
{
  "equation": "C = b + rt",
  "substitutedEquation": "C = 25 + 0.10t",
  "variables": ["base cost b = 25", "rate per text r = 0.10"]
}

Example 2 - System of Equations:
Problem: "Adult tickets are $12, child tickets are $8. Total tickets sold: 85. Revenue: $820."
{
  "equation": "x + y = total, ax + by = cost",
  "substitutedEquation": "x + y = 85, 12x + 8y = 820",
  "variables": []
}

RULES:
- equation: The basic formula/formulas ONLY - just the mathematical expression (like "y = mx + b", "x + y = total, ax + by = cost")
- substitutedEquation: Same formula with values plugged in - ONLY mathematical expressions (like "y = 4x + 30", "x + y = 85, 12x + 8y = 820")
- variables: Simple list of extracted values, format as "description variable = value"
  - Examples: "slope m = 4", "y-intercept b = 30", "cost per mile m = 0.15"
  - For systems: variables should be empty [] since x and y don't have values
  - Only include variables that have numeric values in the substituted equation

CRITICAL: 
- DO NOT include words like "text", "and", or other descriptive words in the equation strings
- DO NOT use LaTeX environment commands like \begin{cases}, \end{cases}, etc. - just use simple comma-separated equations
- For systems, format as: "x + y = 85, 12x + 8y = 820" (comma-separated, NOT LaTeX cases)
- Only include the mathematical expressions themselves (e.g., "c + s = 38, 12c + 8s = 412")
- Keep equations clean and mathematical only - plain text format, no LaTeX environments

If no equation can be found, return:
{
  "equation": "",
  "substitutedEquation": "",
  "variables": []
}`;

            const response = await ai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { 
                        role: "system", 
                        content: "You are a math analysis expert. Extract equations and variable values from algebra problems. Always return valid JSON." 
                    },
                    { role: "user", content: prompt },
                ],
                response_format: { type: "json_object" },
            });

            const text = response.choices[0]?.message?.content ?? "{}";
            ToggleLogs.log(`Raw extraction response: ${text}`, LogLevel.DEBUG);
            
            let parsed: any;
            try {
                parsed = JSON.parse(text);
            } catch (parseErr) {
                ToggleLogs.log(`Failed to parse JSON response: ${parseErr}. Raw text: ${text}`, LogLevel.CRITICAL);
                throw new Error(`Invalid JSON response from AI: ${parseErr}`);
            }
            
            // Validate response structure
            if (!parsed || typeof parsed !== 'object') {
                ToggleLogs.log(`Invalid parsed response: ${JSON.stringify(parsed)}`, LogLevel.CRITICAL);
                throw new Error('Invalid response structure from AI');
            }
            
            // Clean equations - remove unwanted text
            const cleanEquation = (eq: string): string => {
                if (!eq) return "";
                // Remove common unwanted words/phrases
                return eq
                    .replace(/\btext\s+and\s+/gi, '')
                    .replace(/\btext\s*,?\s*/gi, '')
                    .replace(/,\s*,\s*/g, ', ') // Remove double commas
                    .replace(/^\s*,\s*/, '') // Remove leading comma
                    .replace(/\s*,\s*$/, '') // Remove trailing comma
                    .trim();
            };
            
            // Validate and clean variables array
            let cleanedVariables: string[] = [];
            if (Array.isArray(parsed.variables)) {
                cleanedVariables = parsed.variables
                    .filter((v: any) => v !== null && v !== undefined && typeof v === 'string' && v.trim() !== '')
                    .map((v: string) => v.trim());
            } else if (parsed.variables && typeof parsed.variables === 'object') {
                // Handle legacy format - convert object to array
                cleanedVariables = Object.entries(parsed.variables)
                    .map(([key, value]) => {
                        if (value !== null && value !== undefined) {
                            return `${String(value)} ${key}`;
                        }
                        return null;
                    })
                    .filter((v): v is string => v !== null);
            }
            
            const cleanedEquation = cleanEquation(parsed.equation || "");
            const cleanedSubstituted = cleanEquation(parsed.substitutedEquation || "");
            
            ToggleLogs.log(`Extracted equation data: ${JSON.stringify({
                equation: cleanedEquation,
                substitutedEquation: cleanedSubstituted,
                variablesCount: cleanedVariables.length
            })}`, LogLevel.INFO);
            
            return {
                equation: cleanedEquation,
                substitutedEquation: cleanedSubstituted,
                variables: cleanedVariables,
            };
        } catch (err) {
            ToggleLogs.log("Error extracting equation: " + err, LogLevel.CRITICAL);
            return {
                equation: "",
                substitutedEquation: "",
                variables: [],
            };
        }
    }
}

Now extract the equation from the problem above.`;

      const response = await ai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Lower temperature for more consistent extraction
      });

      const text = response.choices[0]?.message?.content ?? "{}";
      ToggleLogs.log(`Raw extraction response: ${text}`, LogLevel.DEBUG);

      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch (parseErr) {
        ToggleLogs.log(`Failed to parse JSON response: ${parseErr}. Raw text: ${text}`, LogLevel.CRITICAL);
        throw new Error(`Invalid JSON response from AI: ${parseErr}`);
      }

      // Validate response
      if (!parsed || typeof parsed !== 'object') {
        ToggleLogs.log(`Invalid parsed response: ${JSON.stringify(parsed)}`, LogLevel.CRITICAL);
        throw new Error('Invalid response structure from AI');
      }

      const cleanedEquation = cleanEquation(parsed.equation || "");
      const cleanedSubstituted = cleanEquation(parsed.substitutedEquation || "");
      const cleanedVariables = cleanVariables(parsed.variables);

      // Validate and fix template
      const finalEquation = validateAndFixTemplate(cleanedEquation, cleanedSubstituted);

      ToggleLogs.log(`Extracted equation data: ${JSON.stringify({
        equation: finalEquation,
        substitutedEquation: cleanedSubstituted,
        variablesCount: cleanedVariables.length,
        wasIdentical: cleanedEquation === cleanedSubstituted
      })}`, LogLevel.INFO);

      return {
        equation: finalEquation,
        substitutedEquation: cleanedSubstituted,
        variables: cleanedVariables,
      };
    } catch (err) {
      ToggleLogs.log("Error extracting equation: " + err, LogLevel.CRITICAL);
      return {
        equation: "",
        substitutedEquation: "",
        variables: [],
      };
    }
  }
}