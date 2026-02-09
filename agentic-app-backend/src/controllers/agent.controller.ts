import type { Request, Response } from "express";
import { GEMINI } from "../services/gemini.service.ts";
import { MCPClient } from "../mcp/client/mcp-client.service.ts";
import { OPENAI } from "../services/openai.service.ts";

export class AgentController {
  static async chat(req: Request, res: Response) {
    const { message, model } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const selectedModel = model || "gpt";

    try {
      const mcp = await MCPClient.init();
      const LLM = selectedModel === "gemini" ? GEMINI : OPENAI;
      const response = await LLM.generateResponseWithTools(message, mcp.client);
      return res.json({ reply: response });
    } catch (error) {
      console.error("Invalid model", error);
      return res
        .status(500)
        .json({ error: "Failed to get a response from the AI." });
    }
  }
}
