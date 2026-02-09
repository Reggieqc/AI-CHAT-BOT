import { GoogleGenAI } from "@google/genai";

class GeminiProvider {
    constructor(apiKey, modelName) {
        this.apiKey = apiKey;
        this.modelName = modelName;

        if (!this.apiKey) {
            throw new Error("API Key is required for GeminiProvider");
        }

        if (!this.modelName) {
            throw new Error("Model Name is required for GeminiProvider");
        }

        this.genAI = new GoogleGenAI({ apiKey: this.apiKey });
    }

    async generateResponse(prompt) {
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

    async generateEmbeddings(data, taskType = 'RETRIEVEL_QUERY') {
        try {
            const response = await this.genAI.models.embedContent({
                model: 'gemini-embedding-001',
                contents: data,
                taskType
            });
            const embeddings = response.embeddings.map(embedding => embedding.values);
            return embeddings;
        } catch (error) {
            console.error("Error generating embeddings:", error);
            throw error;
        }
    }
}

export default GeminiProvider;