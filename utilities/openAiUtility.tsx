// utilities/openAiUtility.tsx

import { OpenAI } from "openai";

/**
 * Creates a singleton instance of the OpenAI client configured with the API key.
 */
const ai = new OpenAI({
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: process.env.EXPO_PUBLIC_OPENAI_ALLOW_BROWSER === "true",
});


export class OpenAIHandler {
    /**
     * Generates a query from a text prompt
     * @param prompt 
     * @returns 
     */
    public static async generateText(prompt: string): Promise<string> {
        try {
            const response = await ai.chat.completions.create({
                model: "gpt-5",
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: prompt },
                ],
            });

            const text = response.choices[0]?.message?.content ?? "";
            return text.trim();
        } catch (err) {
            console.error("Error generating text:", err);
            return "Error generating text.";
        }
    }

    public static async generateFromImage(prompt: string, image: string): Promise<string> {
        try {
            const response = await ai.chat.completions.create({
                model: "gpt-5",
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
            console.error("Error generating text:", err);
            return "Error generating text.";
        }
    }

    /**
     * Generates an Algebra 1 word problem using GPT-5 (optimized for math)
     * @returns A word problem string
     */
    public static async generateAlgebra1Problem(): Promise<string> {
        try {
            const response = await ai.chat.completions.create({
                model: "gpt-5", // Using GPT-5 for better math capabilities
                messages: [
                    { 
                        role: "system", 
                        content: "You are a math teacher specializing in Algebra 1. Generate clear, engaging word problems appropriate for Algebra 1 students. Focus on topics like linear equations, systems of equations, inequalities, or quadratic equations. Make the problems realistic and relatable." 
                    },
                    { 
                        role: "user", 
                        content: "Generate an Algebra 1 word problem. Make it clear, engaging, and appropriate for high school Algebra 1 students. Only return the problem statement, no solutions or hints." 
                    },
                ],
            });

            const text = response.choices[0]?.message?.content ?? "";
            return text.trim();
        } catch (err) {
            console.error("Error generating Algebra 1 problem:", err);
            return "Error generating math problem. Please try again.";
        }
    }
}
