import type { Request, NextFunction, Response } from "express";
import { OPENAI } from "../services/openAI.service.ts";
import { GEMINI } from "../services/gemini.service.ts";


export class ChatController {
    static async generateChatResponse(req: Request, res: Response, next: NextFunction) {

        const { message, model } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const modelName = model || 'gpt';

        try {
            // const response = await GEMINI.generateResponse(message);
            const LLM = modelName  === 'gpt' ? OPENAI : GEMINI;
            const response = await LLM.generateResponseWithTools(message);
            res.json({ reply: response });

        } catch (error) {
            console.error("Error generating response from OpenAI", error);
            res.status(500).json({ error: "Failed to get a response from the AI." });
        }
    }

}
