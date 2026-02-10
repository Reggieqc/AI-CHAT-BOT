import { ChromaClient } from "chromadb";
import { randomUUID } from "node:crypto";

const chroma = new ChromaClient({
  host: process.env.CHROMA_HOST || "localhost",
  port: process.env.CHROMA_PORT ? Number(process.env.CHROMA_PORT) : 8000,
  ssl: process.env.CHROMA_SSL === "true",
});

const COLLECTION = process.env.CHROMA_COLECTION || "rag_documents";

export class VectorStoreChroma {
  private static collection: any; //static it is shared and initialize only once

  static async init() {
    this.collection = await chroma.getOrCreateCollection({
      name: COLLECTION,
    });
  }

  static async upsert(params: {
    id: string;
    docId: string;
    chuckIndex: number;
    text: string;
    embedding: number[];
    metadata?: any;
  }) {
    const { id, docId, chuckIndex, text, embedding, metadata = {} } = params;
    await this.collection.upsert({
      ids: [id],
      metadatas: [
        {
          docId,
          chuckIndex,
          ...metadata,
        },
      ],
      documents: [text],
      embeddings: [embedding],
    });
  }

  static async search(embedding: number[], topK: number = 4) {
    const res = await this.collection.query({
      query_embeddings: [embedding],
      n_results: topK,
    });
    return res.documents[0].map((doc: string, i: number) => ({
      id: randomUUID(),
      text: doc,
      metadata: res.metadatas[0][i],
      score: res.distances?.[0]?.[i] ?? null,
    }));
  }
}
