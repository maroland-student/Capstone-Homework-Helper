// utilities/openAiUtility.tsx

import { OpenAI } from "openai";
import openAIQueryParams from "../server/models/openai-query";
import ToggleLogs, { LogLevel } from "../server/utilities/toggle_logs";
import { getTopicById } from "./topicsLoader";

const ai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser:
    process.env.EXPO_PUBLIC_OPENAI_ALLOW_BROWSER === "true",
});

export class OpenAIHandler {
  public static async generate(
    prompt: string,
    params: openAIQueryParams,
  ): Promise<string> {
    ToggleLogs.log(
      "Processing OpenAI request with params:\n" + JSON.stringify(params),
      LogLevel.INFO,
    );

    const body: any = {};
    body.messages = [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt },
    ];

    if (params?.background != undefined) body.background = params.background;

    if (params?.conversation != undefined)
      body.conversation = params.conversation;

    if (params?.include != undefined) body.include = params.include;

    if (params?.input != undefined) body.input = params.input;

    if (params?.instructions != undefined)
      body.instructions = params.instructions;

    if (params?.max_output_tokens != undefined)
      body.max_output_tokens = params.max_output_tokens;

    if (params?.max_tool_calls != undefined)
      body.max_tool_calls = params.max_tool_calls;

    if (params?.model != undefined) body.model = params.model;

    if (params?.parallel_tool_calls != undefined)
      body.parallel_tool_calls = params.parallel_tool_calls;

    if (params?.previous_response_id != undefined)
      body.previous_response_id = params.previous_response_id;

    if (params?.prompt != undefined) body.prompt = params.prompt;

    if (params?.prompt_cache_key != undefined)
      body.prompt_cache_key = params.prompt_cache_key;

    if (params?.reasoning != undefined) body.reasoning = params.reasoning;

    if (params?.safety_identifier != undefined)
      body.safety_identifier = params.safety_identifier;

    if (params?.service_tier != undefined)
      body.service_tier = params.service_tier;

    if (params?.store != undefined) body.store = params.store;

    if (params?.stream != undefined) body.stream = params.stream;

    if (params?.stream_options != undefined)
      body.stream_options = params.stream_options;

    if (params?.temperature != undefined) body.temperature = params.temperature;

    if (params?.text != undefined) body.text = params.text;

    if (params?.tool_choice != undefined) body.tool_choice = params.tool_choice;

    if (params?.tools != undefined) body.tools = params.tools;

    if (params?.top_logprobs != undefined)
      body.top_logprobs = params.top_logprobs;

    if (params?.top_p != undefined) body.top_p = params.top_p;

    if (params?.truncation != undefined) body.truncation = params.truncation;

    try {
      const response = await ai.chat.completions.create(body);

      const text = response.choices[0]?.message?.content ?? "";
      return text.trim();
    } catch (err) {
      ToggleLogs.log("Error generating text: " + err, LogLevel.CRITICAL);
      return "Error generating text.";
    }
  }

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

  public static async generateFromImage(
    prompt: string,
    image: string,
  ): Promise<string> {
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
  }

  public static async generateAlgebra1Problem(): Promise<string> {
    return this.generateMathProblem([]);
  }

  public static async generateMathProblem(topicIds: string[]): Promise<string> {
    try {
      let topicDescriptions: string[] = [];

      if (topicIds.length > 0) {
        for (const topicId of topicIds) {
          const topicInfo = getTopicById(topicId);
          if (topicInfo) {
            topicDescriptions.push(
              `${topicInfo.topic.name} (from ${topicInfo.category.name})`,
            );
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
          "radical expressions",
        ];
      }

      const selectedTopic =
        topicDescriptions[Math.floor(Math.random() * topicDescriptions.length)];

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
            content:
              "You are a helpful math teacher that creates Algebra 1 word problems. You create engaging, real-world problems that help students understand mathematical concepts.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
      });

      const text = response.choices[0]?.message?.content ?? "";
      return text.trim();
    } catch (err) {
      ToggleLogs.log(
        "Error generating math problem: " + err,
        LogLevel.CRITICAL,
      );
      return "Error generating math problem.";
    }
  }

  public static async generateHint(
    problem: string,
    hintLevel: number,
  ): Promise<string> {
    try {
      const hintPrompts: { [key: number]: string } = {
        1: `You are a helpful math tutor. A student is working on this problem:

"${problem}"

Provide a detailed first hint that helps the student understand:
1. What type of problem this is (e.g., distance/rate/time, area, percentage, linear equation, system of equations, etc.)
2. What they're being asked to find
3. What information has been given to them
4. A general strategy or formula they should consider (mention the formula by name if applicable)

Be specific about the numbers and context in the problem, but don't solve it for them. Write 3-4 sentences.`,

        2: `You are a helpful math tutor. A student is working on this problem:

"${problem}"

They've already seen a general hint about the problem type and approach. Now provide a more detailed second hint that:
1. Explicitly states which formula or equation to use (write out the formula)
2. Identifies each variable in the formula
3. Shows which values from the problem correspond to which variables
4. Explains the next step they should take

Use the actual numbers from the problem and be very specific. Write 4-5 sentences.`,

        3: `You are a helpful math tutor. A student is working on this problem:

"${problem}"

They've seen two previous hints but still need help. Provide a comprehensive third and final hint that:
1. States the complete formula or equation needed
2. Shows the COMPLETE substitution with actual numbers from the problem (e.g., "speed = 120 km ÷ 2 hours")
3. Shows the mathematical expression ready to calculate (e.g., "= 120 ÷ 2")
4. Tells them what units the answer should be in
5. Explains what operation they need to perform to get the final answer

Give them everything except the actual final calculated number. They should only need to do one simple calculation. Write 5-7 sentences showing the complete setup.`,
      };

      const prompt = hintPrompts[hintLevel];
      if (!prompt) {
        throw new Error(`Invalid hint level: ${hintLevel}`);
      }

      ToggleLogs.log(
        `Generating hint level ${hintLevel} for problem: ${problem.substring(0, 100)}...`,
        LogLevel.INFO,
      );

      const response = await ai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an encouraging math tutor who provides clear, detailed hints. Be specific and use concrete examples from the problem. Never give the final answer, but guide students step-by-step. Use simple language and be thorough. IMPORTANT: Do NOT use LaTeX formatting. Do NOT use \\( \\), \\[ \\], $, or any backslash commands. Write all math using plain text with symbols like ×, ÷, ², ³, etc. For example, write 'w + 5' not '\\( w + 5 \\)', and write 'Area = length × width' not '\\text{Area} = \\text{length} \\times \\text{width}'. Write variables and numbers directly without any special formatting.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      const hint = response.choices[0]?.message?.content ?? "";
      if (!hint.trim()) {
        throw new Error("No hint generated from OpenAI");
      }

      const cleanedHint = hint
        .replace(/\\\[/g, "")
        .replace(/\\\]/g, "")
        .replace(/\\\(/g, "")
        .replace(/\\\)/g, "")
        .replace(/\$/g, "")
        .replace(/\\text\{([^}]+)\}/g, "$1")
        .replace(/\\times/g, "×")
        .replace(/\\div/g, "÷")
        .replace(/\\cdot/g, "·")
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1/$2)")
        .replace(/\^2/g, "²")
        .replace(/\^3/g, "³")
        .replace(/\^(\d+)/g, "^$1")
        .replace(/\\le/g, "≤")
        .replace(/\\ge/g, "≥")
        .replace(/\\neq/g, "≠")
        .replace(/\\approx/g, "≈")
        .replace(/\\pm/g, "±")
        .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
        .replace(/\\[a-zA-Z]+/g, "")
        .trim();

      ToggleLogs.log(
        `Generated hint: ${cleanedHint.substring(0, 100)}...`,
        LogLevel.DEBUG,
      );
      return cleanedHint;
    } catch (err) {
      ToggleLogs.log("Error generating hint: " + err, LogLevel.CRITICAL);
      throw new Error(`Failed to generate hint: ${err}`);
    }
  }

  public static async extractEquation(problemText: string): Promise<{
    equation: string;
    substitutedEquation: string;
    variables: string[];
  }> {
    try {
      const prompt = `Extract the equation from this algebra problem.

Problem: "${problemText}"

INSTRUCTIONS:
1. Identify the BASIC FORMULA (like "y = mx + b" for linear, "A = lw" for area, "d = rt" for distance)
2. Create the SUBSTITUTED EQUATION with actual values from the problem
3. Extract variable values from the substituted equation and list them simply
4. CRITICAL: Verify the substituted equation is mathematically correct:
   - All numbers should be correct based on the problem text
   - The equation should be solvable
   - If you cannot verify correctness, return empty strings

Return ONLY a valid JSON object with this EXACT structure:
{
  "equation": "y = mx + b",
  "substitutedEquation": "y = 4x + 30",
  "variables": ["slope m = 4", "y-intercept b = 30"]
}

For systems of equations:
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
            content:
              "You are a math analysis expert. Extract equations and variable values from algebra problems. Always return valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

<<<<<<< HEAD
            const text = response.choices[0]?.message?.content ?? "{}";
            ToggleLogs.log(`Raw extraction response: ${text}`, LogLevel.DEBUG);
            
            let parsed: any;
            try {
                // Try to clean the response if it has markdown code blocks
                let cleanedText = text.trim();
                if (cleanedText.startsWith('```json')) {
                    cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                } else if (cleanedText.startsWith('```')) {
                    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
                }
                
                parsed = JSON.parse(cleanedText);
            } catch (parseErr: any) {
                ToggleLogs.log(`Failed to parse JSON response: ${parseErr?.message || parseErr}. Raw text: ${text}`, LogLevel.CRITICAL);
                throw new Error(`Invalid JSON response from AI: ${parseErr?.message || parseErr}`);
            }
            
            // Validate response structure
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                ToggleLogs.log(`Invalid parsed response type: ${typeof parsed}, value: ${JSON.stringify(parsed)}`, LogLevel.CRITICAL);
                throw new Error('Invalid response structure from AI: expected object, got ' + typeof parsed);
            }
            
            // Validate required fields exist and are correct types
            const validationErrors: string[] = [];
            if (typeof parsed.equation !== 'string') {
                validationErrors.push(`Missing or invalid 'equation' field (expected string, got ${typeof parsed.equation})`);
            }
            if (typeof parsed.substitutedEquation !== 'string') {
                validationErrors.push(`Missing or invalid 'substitutedEquation' field (expected string, got ${typeof parsed.substitutedEquation})`);
            }
            if (!Array.isArray(parsed.variables) && typeof parsed.variables !== 'object') {
                validationErrors.push(`Missing or invalid 'variables' field (expected array or object, got ${typeof parsed.variables})`);
            }
            
            if (validationErrors.length > 0) {
                ToggleLogs.log(`JSON structure validation failed: ${validationErrors.join('; ')}. Parsed: ${JSON.stringify(parsed)}`, LogLevel.CRITICAL);
                throw new Error(`Invalid JSON structure: ${validationErrors.join('; ')}`);
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
            
            // Final validation: ensure we have at least one equation
            if (!cleanedEquation && !cleanedSubstituted) {
                ToggleLogs.log(`Warning: Both equations are empty after cleaning. Original: ${JSON.stringify(parsed)}`, LogLevel.WARN);
            }
            
            // Log the extraction result for debugging
            ToggleLogs.log(`Extracted equation data: ${JSON.stringify({
                equation: cleanedEquation,
                substitutedEquation: cleanedSubstituted,
                variablesCount: cleanedVariables.length,
                originalEquation: parsed.equation,
                originalSubstituted: parsed.substitutedEquation
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

    public static async generateStepCheckpoints(problemText: string, substitutedEquation: string): Promise<{
        targetVariable: string;
        startEquation: string;
        steps: { instruction: string; checkpoint: string }[];
        finalAnswer: string;
    }> {
        try {
            const prompt = `You are helping build "checkpoint" step practice for Algebra 1 / early Algebra 2 topics.

Given:
- Word problem: "${problemText}"
- Start equation (values substituted): "${substitutedEquation}"

Task:
1) Identify what the student should solve for (examples: "x", "y", or "x,y" for a system).
2) Produce 2 to 8 checkpoints that correctly move from the start equation(s) to the solution.
   - This must work for ANY topic (linear equations, systems by substitution/elimination, inequalities, quadratic solving, rational/radical equations, etc.).
3) Each step must include:
   - instruction: a short imperative that describes the single transformation (e.g., "Subtract 25 from both sides", "Add the equations to eliminate y", "Factor the quadratic", "Take the square root of both sides")
   - checkpoint: the result *immediately after that step*
4) Format rules for checkpoints:
   - Plain text math only (no LaTeX environments).
   - For a system, represent multiple equations as a single string separated by commas, e.g. "x + y = 10, 2x - y = 3"
   - For inequalities, keep the inequality sign and direction (e.g., "x > 4").
   - Keep variable names consistent with the start equation(s).
5) CRITICAL VALIDATION: Each checkpoint MUST be mathematically correct:
   - Step 1 checkpoint must be a valid transformation from the start equation
   - Step 2 checkpoint must be a valid transformation from Step 1 checkpoint
   - And so on. Verify each step is correct before including it.
   - If you cannot verify a step is mathematically correct, do NOT include it.
6) If the start equation(s) are unclear or cannot be solved reliably, return steps: [].

Return ONLY valid JSON with EXACT keys:
{
  "targetVariable": "x",
  "startEquation": "100 = 25 + 0.15x",
  "steps": [
    { "instruction": "Subtract 25 from both sides", "checkpoint": "75 = 0.15x" },
    { "instruction": "Divide both sides by 0.15", "checkpoint": "500 = x" }
  ],
  "finalAnswer": "x = 500"
}`;

            const response = await ai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content:
                            "You generate short, checkable algebra checkpoint steps. Always return valid JSON.",
                    },
                    { role: "user", content: prompt },
                ],
                response_format: { type: "json_object" },
                temperature: 0.2,
            });

            const text = response.choices[0]?.message?.content ?? "{}";
            ToggleLogs.log(`Raw step checkpoints response: ${text}`, LogLevel.DEBUG);
            
            let parsed: any;
            try {
                // Try to clean the response if it has markdown code blocks
                let cleanedText = text.trim();
                if (cleanedText.startsWith('```json')) {
                    cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                } else if (cleanedText.startsWith('```')) {
                    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
                }
                
                parsed = JSON.parse(cleanedText);
            } catch (parseErr: any) {
                ToggleLogs.log(`Failed to parse step checkpoints JSON: ${parseErr?.message || parseErr}. Raw text: ${text}`, LogLevel.CRITICAL);
                throw new Error(`Invalid JSON response from AI: ${parseErr?.message || parseErr}`);
            }
            
            // Validate response structure
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                ToggleLogs.log(`Invalid parsed step checkpoints response: ${JSON.stringify(parsed)}`, LogLevel.CRITICAL);
                throw new Error('Invalid response structure from AI: expected object');
            }

            let steps =
                Array.isArray(parsed.steps)
                    ? parsed.steps
                          .filter((s: any) => s && typeof s.instruction === "string" && typeof s.checkpoint === "string")
                          .map((s: any) => ({ instruction: s.instruction.trim(), checkpoint: s.checkpoint.trim() }))
                          .filter((s: any) => s.instruction.length > 0 && s.checkpoint.length > 0)
                          .slice(0, 8)
                    : [];

            // Validate step checkpoints are mathematically correct (basic syntax check)
            const startEq = typeof parsed.startEquation === "string" ? parsed.startEquation : substitutedEquation;
            steps = this.validateStepCheckpointsSync(startEq, steps);

            return {
                targetVariable: typeof parsed.targetVariable === "string" ? parsed.targetVariable : "x",
                startEquation: startEq,
                steps,
                finalAnswer: typeof parsed.finalAnswer === "string" ? parsed.finalAnswer : "",
            };
        } catch (err) {
            ToggleLogs.log("Error generating step checkpoints: " + err, LogLevel.CRITICAL);
            return {
                targetVariable: "x",
                startEquation: substitutedEquation,
                steps: [],
                finalAnswer: "",
            };
        }
    }

    public static async gradeStepAttempt(params: {
        startEquation: string;
        targetVariable: string;
        stepInstruction: string;
        expectedCheckpoint: string;
        studentInput: string;
    }): Promise<{ correct: boolean; feedback: string }> {
        try {
            const prompt = `You are grading ONE checkpoint step of a multi-step math solution.

Start equation: "${params.startEquation}"
Target variable: "${params.targetVariable}"
Step instruction: "${params.stepInstruction}"
Expected checkpoint (result after the step): "${params.expectedCheckpoint}"
Student input: "${params.studentInput}"

Decide if the student's input is mathematically equivalent to the expected checkpoint and matches the step intent.
- This must work for any topic: linear equations, systems (comma-separated equations), inequalities, quadratics, rational/radical equations.
- Accept equivalent rearrangements and harmless formatting differences (e.g., "x = 5" vs "5 = x", reordering equations in a system).
- For inequalities: direction matters.
- Prefer the specific checkpoint for this step; if the student skips ahead, mark incorrect unless their statement is exactly equivalent to the expected checkpoint.

Return ONLY valid JSON:
{ "correct": true, "feedback": "..." }

If incorrect, feedback should be short and helpful, and should NOT reveal every remaining step.`;

            const response = await ai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are a strict but helpful math grader. Always return valid JSON.",
                    },
                    { role: "user", content: prompt },
                ],
                response_format: { type: "json_object" },
                temperature: 0.2,
            });

            const text = response.choices[0]?.message?.content ?? "{}";
            ToggleLogs.log(`Raw grade step response: ${text}`, LogLevel.DEBUG);
            
            let parsed: any;
            try {
                // Try to clean the response if it has markdown code blocks
                let cleanedText = text.trim();
                if (cleanedText.startsWith('```json')) {
                    cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                } else if (cleanedText.startsWith('```')) {
                    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
                }
                
                parsed = JSON.parse(cleanedText);
            } catch (parseErr: any) {
                ToggleLogs.log(`Failed to parse grade step JSON: ${parseErr?.message || parseErr}. Raw text: ${text}`, LogLevel.CRITICAL);
                return { correct: false, feedback: "Could not grade this step. Please try again." };
            }
            
            // Validate response structure
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                ToggleLogs.log(`Invalid parsed grade step response: ${JSON.stringify(parsed)}`, LogLevel.CRITICAL);
                return { correct: false, feedback: "Could not grade this step. Please try again." };
            }
            
            return {
                correct: Boolean(parsed.correct),
                feedback: typeof parsed.feedback === "string" ? parsed.feedback : (Boolean(parsed.correct) ? "Correct." : "Incorrect."),
            };
        } catch (err) {
            ToggleLogs.log("Error grading step attempt: " + err, LogLevel.CRITICAL);
            return { correct: false, feedback: "Could not grade this step. Please try again." };
        }
    }

    /**
     * Validates that step checkpoints are mathematically correct transformations
     * Uses AI to verify each step is a valid transformation from the previous step
     */
    private static async validateStepCheckpoints(
        startEquation: string,
        steps: { instruction: string; checkpoint: string }[]
    ): Promise<{ instruction: string; checkpoint: string }[]> {
        if (steps.length === 0) return [];

        const validatedSteps: { instruction: string; checkpoint: string }[] = [];
        let previousEquation = startEquation;

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            
            try {
                // Use AI to verify this step is a valid transformation
                const prompt = `Verify this algebra step is mathematically correct:

Previous equation: "${previousEquation}"
Step instruction: "${step.instruction}"
Result checkpoint: "${step.checkpoint}"

Is the checkpoint a valid mathematical transformation from the previous equation following the instruction?
- Check that the operation described in the instruction was correctly applied
- Verify the result is mathematically equivalent and correct
- For systems: verify both equations are correctly transformed
- For inequalities: verify the direction is correct

Return ONLY valid JSON:
{ "isValid": true/false, "reason": "brief explanation" }`;

                const response = await ai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: "You are a strict math validator. Verify algebraic transformations are correct. Always return valid JSON.",
                        },
                        { role: "user", content: prompt },
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.1,
                });

                const text = response.choices[0]?.message?.content ?? "{}";
                const validation = JSON.parse(text);

                if (Boolean(validation.isValid)) {
                    validatedSteps.push(step);
                    previousEquation = step.checkpoint;
                } else {
                    ToggleLogs.log(
                        `Step ${i + 1} failed validation: ${validation.reason || "Invalid transformation"}`,
                        LogLevel.WARN
                    );
                    // Stop at first invalid step
                    break;
                }
            } catch (err) {
                ToggleLogs.log(`Error validating step ${i + 1}: ${err}`, LogLevel.WARN);
                // If validation fails, include the step but log a warning
                validatedSteps.push(step);
                previousEquation = step.checkpoint;
            }
        }

        return validatedSteps;
    }

    /**
     * Synchronous version that validates steps without AI (faster, less thorough)
     * Checks basic syntax and structure
     */
    private static validateStepCheckpointsSync(
        startEquation: string,
        steps: { instruction: string; checkpoint: string }[]
    ): { instruction: string; checkpoint: string }[] {
        if (steps.length === 0) return [];

        const validatedSteps: { instruction: string; checkpoint: string }[] = [];
        let previousEquation = startEquation;

        for (const step of steps) {
            // Basic validation: checkpoint should contain = or inequality sign
            const hasEquals = step.checkpoint.includes("=") || /[<>≤≥]/.test(step.checkpoint);
            if (!hasEquals) {
                ToggleLogs.log(`Step checkpoint missing = or inequality: ${step.checkpoint}`, LogLevel.WARN);
                break;
            }

            // Check for balanced parentheses
            const openParens = (step.checkpoint.match(/\(/g) || []).length;
            const closeParens = (step.checkpoint.match(/\)/g) || []).length;
            if (openParens !== closeParens) {
                ToggleLogs.log(`Step checkpoint has unbalanced parentheses: ${step.checkpoint}`, LogLevel.WARN);
                break;
            }

            validatedSteps.push(step);
            previousEquation = step.checkpoint;
        }

        return validatedSteps;
    }
=======
      const text = response.choices[0]?.message?.content ?? "{}";
      ToggleLogs.log(`Raw extraction response: ${text}`, LogLevel.DEBUG);

      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch (parseErr) {
        ToggleLogs.log(
          `Failed to parse JSON response: ${parseErr}. Raw text: ${text}`,
          LogLevel.CRITICAL,
        );
        throw new Error(`Invalid JSON response from AI: ${parseErr}`);
      }

      if (!parsed || typeof parsed !== "object") {
        ToggleLogs.log(
          `Invalid parsed response: ${JSON.stringify(parsed)}`,
          LogLevel.CRITICAL,
        );
        throw new Error("Invalid response structure from AI");
      }

      const cleanEquation = (eq: string): string => {
        if (!eq) return "";
        return eq
          .replace(/\btext\s+and\s+/gi, "")
          .replace(/\btext\s*,?\s*/gi, "")
          .replace(/,\s*,\s*/g, ", ")
          .replace(/^\s*,\s*/, "")
          .replace(/\s*,\s*$/, "")
          .trim();
      };

      let cleanedVariables: string[] = [];
      if (Array.isArray(parsed.variables)) {
        cleanedVariables = parsed.variables
          .filter(
            (v: any) =>
              v !== null &&
              v !== undefined &&
              typeof v === "string" &&
              v.trim() !== "",
          )
          .map((v: string) => v.trim());
      } else if (parsed.variables && typeof parsed.variables === "object") {
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
      const cleanedSubstituted = cleanEquation(
        parsed.substitutedEquation || "",
      );

      ToggleLogs.log(
        `Extracted equation data: ${JSON.stringify({
          equation: cleanedEquation,
          substitutedEquation: cleanedSubstituted,
          variablesCount: cleanedVariables.length,
        })}`,
        LogLevel.INFO,
      );

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
>>>>>>> origin/staging
}
