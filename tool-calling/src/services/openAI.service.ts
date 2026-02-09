import { WeatherService } from "./weather.service.ts";
import { CustomerService } from "./customer.service.ts";
import OpenAI from 'openai';
import type { ResponseInput, Tool } from "openai/resources/responses/responses.mjs";

class OpenAIService {
    private static instance: OpenAIService;
    private readonly modelName: string;
    private readonly openAI: OpenAI;

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
        return this.instance
    }

    async generateResponse(prompt: string) {
        try {
            const response = await this.openAI.responses.create({
                model: this.modelName,
                input: prompt,
            })
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

            const embeddings = response.data.map(embedding => embedding.embedding);
            return embeddings;

        } catch (error) {
            console.error("Error generating embeddings:", error);
            throw error;
        }
    }

    async callLLM(contents: string | ResponseInput, tools: Tool[] | undefined, instructions?: string) {
        try {
            const response = await this.openAI.responses.create({
                model: this.modelName,
                input: contents,
                tools,
                instructions,
            });
            return response;
        } catch (error) {
            console.error('Error calling LLM:', error);
            throw error;
        }
    }

    async generateResponseWithTools(prompt: string): Promise<string> {
        try {
            const getWeatherFn: Tool = {
                type: "function",
                name: 'get_current_weather',
                description: 'Fetches live weather data for a given location.',
                strict: true,
                parameters: {
                    type: "object",
                    properties: {
                        location: {
                            type: "string",
                            description: 'The city and state, e.g. San Francisco, CA',
                        },
                    },
                    required: ['location'],
                    additionalProperties: false,
                }
            };

            const getCustomersFn: Tool = {
                type: "function",
                name: "get_all_customers",
                description: "Retrieves a list of all registered customers",
                strict: true,
                parameters: {
                    type: "object",
                    properties: {
                        limit: {
                            type: ["number", "null"],
                            description: 'Maximum number of customers to retrieve',
                        },
                    },
                    required: ["limit"],
                    additionalProperties: false,
                },
            };

            const tools = [getWeatherFn, getCustomersFn];

            //Ai model Calling
            let input: ResponseInput = [
                {
                    role: 'user',
                    content: prompt,
                }
            ]
            const response = await this.callLLM(input, tools);

            //handle function calls
            for (const item of response.output) {
                input.push(item); //original function call, where it gets if the type is a function call

                if (item.type !== 'function_call') {
                    continue;
                }

                const { name, arguments: rawArgs, call_id } = item;
                const args = rawArgs ? JSON.parse(rawArgs) : {};

                let result: any;

                switch (name) {
                    case 'get_current_weather':
                        {
                            const location = (args as { location: string })?.location;

                            if (typeof location !== "string") {
                                throw new Error('Invalid location');
                            }
                            result = await WeatherService.fetchWeatherData(location);
                            break;
                        }
                    case 'get_all_customers':
                        {
                            const limit = (args as { limit: number })?.limit;
                            result = await CustomerService.getLatestCustomers(limit);
                            break;
                        }
                    default:
                        throw new Error(`Unknown function: ${name}`);
                }
                // send the result back to the AI model for structure response
                input.push({
                    type: 'function_call_output',
                    call_id,
                    output: JSON.stringify(result)
                });
            }

            // final response after handling all function calls
            const instructions = "Respond clearly using the tool output.";
            const finalResponse = await this.callLLM(input, tools, instructions);

            return finalResponse.output_text || "No response generated.";
        } catch (error) {
            console.error("Error generating response:", error);
            throw error;
        }
    }
}
export const OPENAI = OpenAIService.getInstance();
