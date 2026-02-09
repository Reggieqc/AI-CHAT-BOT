import { FunctionCallingConfigMode, GoogleGenAI, Type, type ContentListUnion, type ToolListUnion } from "@google/genai";
import { WeatherService } from "./weather.service.ts";
import { CustomerService } from "./customer.service.ts";

class GeminiService {
    private static instance: GeminiService;
    private readonly modelName: string;
    private readonly genAI: GoogleGenAI;

    constructor(modelName: string = process.env.GEMINI_MODEL!) {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error("API Key is required ");
        }

        if (!modelName) {
            throw new Error("Model Name is required");

        }
        this.modelName = modelName;
        console.log(this.modelName);
        this.genAI = new GoogleGenAI({ apiKey });
    }

    static getInstance(modelName?: string): GeminiService {
        if (!this.instance) {
            this.instance = new GeminiService(modelName);
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

    async callLLM(contents: ContentListUnion, tools: ToolListUnion) {
        try {
            const response = await this.genAI.models.generateContent({
                model: this.modelName,
                contents,
                config: {
                    tools,
                    toolConfig: {
                        functionCallingConfig: {
                            mode: FunctionCallingConfigMode.AUTO,
                        }
                    }
                }
            });
            return response;
        } catch (error) {
            console.error('Error calling LLM:', error);
            throw error;
        }
    }

    async generateResponseWithTools(prompt: string): Promise<string> {
        try {
            const getWeatherFn = {
                name: 'get_current_weather',
                description: 'Fetches live weather data for a given location.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        location: {
                            type: Type.STRING,
                            description: 'The city and state, e.g. San Francisco, CA',
                        },
                    },
                    required: ['location'],
                }
            };

            const getCustomersFn = {
                name: "get_all_customers",
                description: "Retrieves a list of all registered customers",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        limit: {
                            type: Type.INTEGER,
                            description: 'Maximum number of customers to retrieve',
                        },
                    }
                },
            };

            const tools = [{
                functionDeclarations: [getWeatherFn, getCustomersFn],
            }]

            //Ai model Calling
            const response = await this.callLLM(prompt, tools);

            // if gemini decides to call a tool
            if (response.functionCalls && response.functionCalls.length > 0) {
                const fnCall = response.functionCalls[0];
                const { name, args } = fnCall;
                console.log(response.functionCalls[0]);

                let result: any;

                switch (name) {
                    case 'get_current_weather':
                        const location = (args as { location: string })?.location;

                        if (typeof location !== "string") {
                            throw new Error('Invalid location');
                        }
                        result = await WeatherService.fetchWeatherData(location);
                        break;
                    case 'get_all_customers':
                        const limit = (args as { limit: number })?.limit;
                        result = await CustomerService.getLatestCustomers(limit);
                        break;
                    default:
                        throw new Error(`Unknown function: ${name}`);
                }

                // Send result back Response to the LLM for structured response
                const responseFolllowUp = await this.callLLM([
                    {
                        role: 'user',
                        parts: [{ text: prompt }]
                    },
                    {
                        role: 'model',
                        parts: [{ functionCall: { name, args: args as any } }]
                    },
                    {
                        role: 'user',
                        parts: [
                            {
                                functionResponse: {
                                    name,
                                    response: { result }
                                }
                            },
                        ]
                    }
                ], tools);
                return responseFolllowUp.text || "No response generated.";
            }

            //if gemini answered directly and don't call functions calls
            return response.text || "No response generated.";
        } catch (error) {
            console.error("Error generating response:", error);
            throw error;
        }
    }

}

export const GEMINI = GeminiService.getInstance();
