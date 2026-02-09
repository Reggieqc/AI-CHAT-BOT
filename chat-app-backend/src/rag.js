import fs from 'node:fs';
import path from 'node:path';
import cosineSimilarity from "compute-cosine-similarity";
class RagProvider {
    fetchDocumentData(fileName) {
        const filePath = path.join(process.cwd(), 'data', fileName);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return data;
    }

    prepareSimpleRagPrompt(query) {
        const kbData = this.fetchDocumentData('knowledgeBase.json');
        const context = kbData.map(item => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n');

        const promp = `You are an AI assistant with access to the following knowledge base:
        ${context}
        Based on the above knowledge, answer the following user question:
        User: ${query}\n
        Answer in one short paragraph.
        `;

        return promp;
    }

    prepareRagPromp(query, queryVector, faqVectors) {
        const ranked = faqVectors.map((item) => ({
            ...item,
            similarity: cosineSimilarity(queryVector, item.vector)
        })).sort((a, b) => b.similarity - a.similarity).slice(0, 2);

        const context = ranked.map((item) => item.answer).join('\n');

        const prompt = `
        Use the context below to answer. If the answer isn't there, say "It's not available in the documentation, but I will try to help you as best as I can." and try to help based on you rgeneral knowledge.
        
        Context:
        ${context}

        User: ${query}`.trim() //avoid use token al pedo
        
        return prompt;
    }
}

export default RagProvider;