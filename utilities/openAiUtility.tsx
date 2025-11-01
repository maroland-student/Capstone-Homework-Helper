// utilities/openAiUtility.tsx

import { OpenAI } from "openai";
import openAIQueryParams from '../server/models/openai-query';
import ToggleLogs, { LogLevel } from '../server/utilities/toggle_logs';

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

        if(params?.background != undefined)
            body.background = params.background;

        if(params?.conversation != undefined)
            body.conversation = params.conversation;

        if(params?.include != undefined)
            body.include = params.include;

        if(params?.input != undefined)
            body.input = params.input;

        if(params?.instructions != undefined)
            body.instructions = params.instructions;

        if(params?.max_output_tokens != undefined)
            body.max_output_tokens = params.max_output_tokens;

        if(params?.max_tool_calls != undefined)
            body.max_tool_calls = params.max_tool_calls;

        if(params?.model != undefined)
            body.model = params.model;

        if(params?.parallel_tool_calls != undefined)
            body.parallel_tool_calls = params.parallel_tool_calls;

        if(params?.previous_response_id != undefined)
            body.previous_response_id = params.previous_response_id;

        if(params?.prompt != undefined)
            body.prompt = params.prompt;

        if(params?.prompt_cache_key != undefined)
            body.prompt_cache_key = params.prompt_cache_key;

        if(params?.reasoning != undefined)
            body.reasoning = params.reasoning;

        if(params?.safety_identifier != undefined)
            body.safety_identifier = params.safety_identifier;

        if(params?.service_tier != undefined)
            body.service_tier = params.service_tier;

        if(params?.store != undefined)
            body.store = params.store;

        if(params?.stream != undefined)
            body.stream = params.stream;

        if(params?.stream_options != undefined)
            body.stream_options = params.stream_options;

        if(params?.temperature != undefined)
            body.temperature = params.temperature;

        if(params?.text != undefined)
            body.text = params.text;

        if(params?.tool_choice != undefined)
            body.tool_choice = params.tool_choice;

        if(params?.tools != undefined)
            body.tools = params.tools;

        if(params?.top_logprobs != undefined)
            body.top_logprobs = params.top_logprobs;

        if(params?.top_p != undefined)
            body.top_p = params.top_p;

        if(params?.truncation != undefined)
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
    }

    /**
     * Generates an Algebra 1 word problem
     * @returns A string containing the generated word problem
     */
    public static async generateAlgebra1Problem(): Promise<string> {
        try {
            const prompt = "Generate a single Algebra 1 word problem. Return only the problem text, no solutions or explanations.";
            const response = await ai.chat.completions.create({
                model: "gpt-5",
                messages: [
                    { role: "system", content: "You are a helpful math teacher that creates Algebra 1 word problems." },
                    { role: "user", content: prompt },
                ],
            });

            const text = response.choices[0]?.message?.content ?? "";
            return text.trim();
        } catch (err) {
            ToggleLogs.log("Error generating Algebra 1 problem: " + err, LogLevel.CRITICAL);
            return "Error generating math problem.";
        }
    }
}
