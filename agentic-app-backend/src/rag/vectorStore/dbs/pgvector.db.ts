import { Pool } from "pg";
import pgvector from "pgvector/pg";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

pool.on("connect", async (client) => {
  console.log("Connected to PostgreSQL database");
  await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
  await pgvector.registerTypes(client);
});

export class VectorStorePg {
  private static initialized = false;
  private static table = process.env.PGVECTOR_TABLE || "rag_vectors";
  private static dims = Number(process.env.PGVECTOR_DIMS || 3072);

  static async init() {
    if (this.initialized) return;
    console.log("Initializing pgvector table...");
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${this.table} (
        id TEXT PRIMARY KEY,
        doc_id TEXT NOT NULL,
        chunk_index INT,
        content TEXT,
        metadata JSONB,
        embedding VECTOR(${this.dims})
      );
    `;
    await pool.query(createTableQuery);
    console.log(
      "pgvector skipping all indexes (3071 dims exceed indec limits)...",
    );
  }

  static async upsert(params: {
    id: string;
    docId: string;
    chuckIndex: number;
    text: string;
    embedding: number[];
    metadata?: any;
  }) {
    const { id, docId, chuckIndex, text, embedding, metadata } = params;

    if (embedding.length !== this.dims) {
      throw new Error(
        `Embedding dimension mismatch. Expected ${this.dims}, got ${embedding.length}`,
      );
    }

    const query = `
      INSERT INTO ${this.table} (id, doc_id, chunk_index, content, metadata, embedding)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        content = EXCLUDED.content,
        metadata = EXCLUDED.metadata,
        embedding = EXCLUDED.embedding;
    `;

    await pool.query(query, [
      id,
      docId,
      chuckIndex,
      text,
      JSON.stringify(metadata) || null,
      pgvector.toSql(embedding),
    ]);
  }

  static async search(queryEmbedding: number[], topK: number = 4) {
    const searchQuery = `
      SELECT id, doc_id, chunk_index, content, metadata, embedding <=> $1 AS distance
      FROM ${this.table}
      ORDER BY embedding <=> $1
      LIMIT $2;
    `;
    const result = await pool.query(searchQuery, [
      pgvector.toSql(queryEmbedding),
      topK,
    ]);
    return result.rows.map((row) => ({
      id: row.id,
      content: row.content,
      text: row.content,
      metadata: {
        docId: row.doc_id,
        chunkIndex: row.chunk_index,
        chuckIndex: row.chunk_index,
        ...JSON.parse(row.metadata || "{}"),
      },
      score: row.distance,
    }));
  }
}

// cosine /distance logic lives on the pgvector side
