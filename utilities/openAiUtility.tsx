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
                model: "gpt-4o-mini",
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
            console.error("Error generating text:", err);
            return "Error generating text.";
        }
    }
}
