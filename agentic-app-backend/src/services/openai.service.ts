import { WeatherService } from "./weather.service.ts";
import { CustomerService } from "./customer.service.ts";
import OpenAI from "openai";
import type { Client } from "@modelcontextprotocol/sdk/client";
import { zodTextFormat } from "openai/helpers/zod.mjs";
import { z } from "zod";

// JSON PRIMITIVES (OPenAI + MCP SAFE)
const JsonPrimitive = z.union([z.string(), z.number(), z.boolean(), z.null()]);

/**
 * TOOL Arguments
 *  - Must be an object for MCP
 *  - No `any`, no optional
 */
const ToolArgumentSchema = z.object({}).catchall(JsonPrimitive);

/**
 * FINAL INTENT SCHEMA
   - Root object
   - All fields required
   - Nullable used correctly
 */
const ToolIntentSchema = z
  .object({
    action: z.enum(["final", "tool"]),
    tool: z.string().nullable(),
    arguments: ToolArgumentSchema.nullable(),
    output: z.string().nullable(),
  })
  .refine(
    (data) =>
      (data.action === "tool" &&
        data.tool !== null &&
        data.arguments !== null) ||
      (data.action === "final" && data.output !== null),
    {
      message: "Invalid intent shape",
    },
  );

class OpenAIService {
  private static instance: OpenAIService;
  private readonly modelName: string;
  private readonly openAI: OpenAI;
  private readonly MAX_STEPS = 6;

  constructor(modelName: string = process.env.OPENAI_MODEL!) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("API Key is required ");
    }

    if (!modelName) {
      throw new Error("Model Name is required");
    }

    this.modelName = modelName;
    console.log(this.modelName);
    this.openAI = new OpenAI({ apiKey });
  }

  static getInstance(modelName?: string): OpenAIService {
    if (!this.instance) {
      this.instance = new OpenAIService(modelName);
    }
    return this.instance;
  }

  async generateResponse(prompt: string) {
    try {
      const response = await this.openAI.responses.create({
        model: this.modelName,
        input: prompt,
      });
      return response.output_text || "No response generated.";
    } catch (error) {
      console.error("Error generating response:", error);
      throw error;
    }
  }

  async generateEmbeddings(data: string | string[]) {
    try {
      const response = await this.openAI.embeddings.create({
        model: "text-embedding-3-small",
        input: data,
        encoding_format: "float",
      });

      const embeddings = response.data.map((embedding) => embedding.embedding);
      return embeddings;
    } catch (error) {
      console.error("Error generating embeddings:", error);
      throw error;
    }
  }

  async generateResponseWithTools(
    prompt: string,
    mcpClient: Client,
  ): Promise<string> {
    const mcpTools = await mcpClient.listTools();

    const toolContext = mcpTools.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      outputSchema: tool.outputSchema,
    }));
    const systemIntruction = `
      You are an AI assistant with access to internal tools via MCP. Use the tools as needed to answer user queries.
      If no tool is required, answer directly.

      Do NOT mention tool usage unless asked.
      Keep responses concise and helpful.
    `;

    // hard response contract
    const responseContract = `
      You MUST ALWAYS respond in valid JSON.

      If NO tool is required:
      {
        "action": "final",
        "tool": null,
        "arguments: null,
        "output": "<response>"
      }

      If a tool IS required:
      {
        "action": "tool",
        "tool": "<tool_name>",
        "arguments": {
          // tool-specific arguments here
        },
        "output": null
      }

      NEVER respond with plain text.
    `;

    // message state
    let messages: any[] = [
      {
        role: "developer",
        content: systemIntruction,
      },
      {
        role: "developer",
        content: responseContract,
      },
      {
        role: "developer",
        content: `Available tools: ${JSON.stringify(toolContext, null, 2)}`,
      },
      {
        role: "user",
        content: prompt,
      },
    ];

    //agent loop
    for (let step = 0; step < this.MAX_STEPS; step++) {
      let intent: any;
      try {
        const response = await this.openAI.responses.parse({
          model: this.modelName,
          input: messages,
          text: {
            format: zodTextFormat(ToolIntentSchema, "intent"),
          },
        });
        if (!response.output_parsed) {
          throw new Error("Failed to parse respone.");
        }
        intent = response.output_parsed;
      } catch (error: any) {
        console.log("OpenAI parse failure:", error);
        throw new Error(
          `Sorry, I couldn't process that properle. Please try again`,
        );
      }

      //tool execution
      if (intent.action === "tool") {
        const result = await mcpClient.callTool({
          name: intent.tool,
          arguments: intent.arguments,
        });

        messages.push({
          role: "assistant",
          content: JSON.stringify(intent),
        });
        messages.push({
          role: "developer",
          content: `MCP too: "${intent.tool} executed".
          Structured output: 
          ${JSON.stringify(result.structuredContent, null, 2)}
          `,
        });
        continue;
      }

      //final answer
      if (intent.action === "final") {
        return intent.output;
      }
    }

    throw new Error("Agent exceeded maximun reasoning steps");
  }
}
export const OPENAI = OpenAIService.getInstance();
