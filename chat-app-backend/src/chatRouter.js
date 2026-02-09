import express from "express";
import GeminiProvider from "./geminiProvider.js";
import RagProvider from "./rag.js";
import OpenAIProvider from "./openAIProvider.js";

const router = express.Router();

router.post("/chat", async (req, res) => {
    const { message, model } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    console.log(`Received message: ${message}`);

    const modelName = model || process.env.GEMINI_MODEL;


    try {

        // Incorportate RAG to prepare the prompt
        const rag = new RagProvider();

        let llmProvider;


        // For RAG with embeddings, we would first need to generate the query embedding
        if (modelName === process.env.GEMINI_MODEL) {
            llmProvider = new GeminiProvider(process.env.GEMINI_API_KEY, process.env.GEMINI_MODEL);
        } else {
            llmProvider = new OpenAIProvider(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL);
        }
        const queryEmbedding = await llmProvider.generateEmbeddings(message);
        const queryVector = queryEmbedding[0];

        // Fetch FAQ vector from faqs.json
        const faqData = rag.fetchDocumentData('faqs.json');
        const faqEmbeddings = await llmProvider.generateEmbeddings(faqData.map(item => item.answer), llmProvider instanceof GeminiProvider ? 'RETRIEVAL_DOCUMENt' : undefined);
        const faqVectors = faqData.map((faq, index) => ({
            ...faq,
            vector: faqEmbeddings[index],
        }));

        const prompt = rag.prepareRagPromp(message, queryVector, faqVectors);

        // const prompt = rag.prepareSimpleRagPrompt(message);

        console.log(`Prepared prompt: ${prompt}`);
        // generate response using llmm provider with RAG-prepared prompt
        const response = await llmProvider.generateResponse(prompt);
        return res.json({ reply: response });
    } catch (error) {
        console.error("Error processing message:", error);
        return res.status(500).json({ error: "Failed to get a response from the AI" });
    }
});

export default router;

