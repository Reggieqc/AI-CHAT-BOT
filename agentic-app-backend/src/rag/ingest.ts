import { VectorStore } from "./vectorStore/vector.store.ts";
import fs from "node:fs";
import path from "node:path";
import { GEMINI } from "../services/gemini.service.ts";
import { randomUUID } from "node:crypto";

const CHUNK_SIZE = Number(process.env.RAG_CHUNK_SIZE) || 800;
const CHUNK_OVERLAP = Number(process.env.RAG_CHUNK_OVERLAP) || 100;

function chunkText(text: string): string[] {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(text.length, i + CHUNK_SIZE);
    chunks.push(text.slice(i, end));
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
}

export async function ingestFolder(folderPath: string) {
  const Store = VectorStore.get();

  await Store?.init();

  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    if (!file.endsWith(".md") && !file.endsWith(".txt")) {
      continue;
    }

    const filePath = path.join(folderPath, file);
    const rawData = fs.readFileSync(filePath, "utf8");
    // conver string to chunks
    const chunks = chunkText(rawData);

    // fetch embedding values for each chunk
    const embeddings = await GEMINI.generateEmbeddings(chunks);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      await Store?.upsert({
        id: randomUUID(),
        docId: file,
        chuckIndex: i,
        text: chunk,
        embedding: embeddings?.[i] ?? [],
        metadata: {
          source: filePath,
        },
      });
    }
    console.log(`Ingest: ${file}`);
  }
}

if (import.meta.url.includes("ingest")) {
  // node src/rag/ingest.ts sc/data/rag_docs
  const folder = process.argv[2];
  if (!folder) {
    console.log("Usage: node src/rag/ingest.ts <folder_path>");
    process.exit(1);
  }
  ingestFolder(folder);
}
