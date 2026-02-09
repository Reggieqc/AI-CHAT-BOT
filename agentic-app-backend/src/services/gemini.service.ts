import { GoogleGenAI, mcpToTool } from "@google/genai";
import type { Client } from "@modelcontextprotocol/sdk/client";

class GeminiService {
    private static instance: GeminiService;
    private readonly modelName: string;
    private readonly genAI: GoogleGenAI;

    constructor(
        modelName: string = process.env.GEMINI_MODEL!
    ) {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error("API Key is required ");
        }

        if (!modelName) {
            throw new Error("Model Name is required");

        }
        this.modelName = modelName;
        this.genAI = new GoogleGenAI({ apiKey });
    }

    static getInstance(modelName?: string): GeminiService {
        if (!GeminiService.instance) {
            GeminiService.instance = new GeminiService(modelName);
        }
        return this.instance
    }

    async generateResponse(prompt: string): Promise<string> {
        try {
            const response = await this.genAI.models.generateContent({
                model: this.modelName,
                contents: prompt
            });
            return response.text || "No response generated.";
        } catch (error) {
            console.error("Error generating response:", error);
            throw error;
        }
    }

    async generateResponseWithTools(prompt: string, mcpClient: Client): Promise<string> {
        try {
            const response = await this.genAI.models.generateContent({
                model: this.modelName,
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt },
                        ]
                    },
                ],
                config: {
                    systemInstruction: {
                        role: 'model',
                        parts: [{ text: 'You are an AI assistant specialized in E-commerce data (orders and customers) and weather data too. When the user asks a question about orders or customers or weather information, use the provided tools. **If the question is unrelated to your tools, answer using your intrinsic knowledge.** Be concise and do not mention the tools were used unless asked.' }]
                    },
                    tools: [
                        mcpToTool(mcpClient)
                    ],
                }
            });
            //Fetch response data 
            return this.extractResponseText(response);
        } catch (error) {
            console.error("Error generating response:", error);
            throw error;
        }
    }

    extractResponseText(response: any): string {
        const candidate = response?.candidates?.[0];
        if (!candidate) return 'No response generated';

        // step 1: Find the primary text part in the models final response
        const textPart = candidate.content?.parts?.find((part: any) => part.text);
        if (textPart && textPart.text) {
            return textPart.text.trim();
        }

        //step 2: Fallback for debugging
        const structuredPart = candidate.content?.parts?.find((part: any) => part.functionResponse?.response?.structuredContent);
        if (structuredPart) {
            return (
                "Tool executed successfully, but no natural language summary was provided. Raw data:\n" +
                JSON.stringify(
                    structuredPart.functionResponse.response.structuredContent,
                    null,
                    2
                )
            )
        }

        return 'No response generated';
    }

    async generateEmbeddings(data: string | string[], taskType = 'RETRIEVEL_QUERY') {
        try {
            const response = await this.genAI.models.embedContent({
                model: 'gemini-embedding-001',
                contents: data,
                config: {
                    taskType,
                }
            });
            const embeddings = response.embeddings?.map(embedding => embedding.values);
            return embeddings;
        } catch (error) {
            console.error("Error generating embeddings:", error);
            throw error;
        }
    }
}

export const GEMINI = GeminiService.getInstance();
