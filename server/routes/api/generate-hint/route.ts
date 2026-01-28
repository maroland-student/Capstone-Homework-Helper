import express from "express";

const router = express.Router();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

router.post("/api/openai/generate-hint", async (req, res) => {
  try {
    const { problem, equation, substitutedEquation, variables, hintLevel } =
      req.body;

    if (!problem) {
      return res.status(400).json({ error: "Problem text is required" });
    }

    const hintPrompts = {
      1: `You are a helpful math tutor. A student is working on this problem:

"${problem}"

Provide a detailed first hint that helps the student understand:
1. What type of problem this is (e.g., distance/rate/time, area, percentage, etc.)
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

    const prompt = hintPrompts[hintLevel as keyof typeof hintPrompts];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are an encouraging math tutor who provides clear, detailed hints. Be specific and use concrete examples from the problem. Never give away the final answer, but guide students step-by-step. Use simple language and be thorough.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const hint =
      data.choices[0]?.message?.content?.trim() || "Unable to generate hint.";

    return res.json({ hint, level: hintLevel });
  } catch (error) {
    console.error("Error generating hint:", error);
    return res.status(500).json({ error: "Failed to generate hint" });
  }
});

export default router;
