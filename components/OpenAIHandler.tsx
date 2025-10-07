import { OpenAI } from "openai";

const ai = new OpenAI({
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

export class OpenAIHandler {
    constructor() {
        console.log("OpenAIHandler initialized");
    }

    writeKey() {
        console.log("OpenAI API Key:", process.env.EXPO_PUBLIC_OPENAI_API_KEY);
    }

    async generateText(prompt: string): Promise<string> {
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
}
