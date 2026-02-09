import type { Request, NextFunction, Response } from "express";
import { GEMINI } from "../services/gemini.service.ts";

export class ChatController {
  static async generateChatResponse(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    try {
      const response = await GEMINI.generateResponse(message);
      res.json({ reply: response });
    } catch (error) {
      console.error("Error generating response from Gemini", error);
      res.status(500).json({ error: "Failed to get a response from the AI." });
    }
  }
}
