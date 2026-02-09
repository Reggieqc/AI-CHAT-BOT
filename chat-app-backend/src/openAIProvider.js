import OpenAI from "openai";

class OpenAIProvider {
    constructor(apiKey, modelName) {
        this.apiKey = apiKey;
        this.modelName = modelName;

        if (!this.apiKey)
            throw new Error("API Key is required for OpenAIProvider");

        if (!this.modelName)
            throw new Error("Model Name is required for OpenAIProvider");

        this.openAI = new OpenAI({ apiKey: this.apiKey, modelName: this.modelName });

    }

    async generateResponse(prompt) {
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

    async generateEmbeddings(data) {
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
}

export default OpenAIProvider;
