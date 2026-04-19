import OpenAI from "openai";
import prisma from "@/lib/prisma";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OPENAI_API_KEY environment variable");
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

export const EMBEDDING_DIMENSIONS = 1536;

/** Single text embedding for RAG query (used by knowledge search). */
export async function embedText(text: string): Promise<number[]> {
  const model = process.env.EMBEDDING_MODEL ?? "text-embedding-3-small";
  const truncated = text.slice(0, 32000);
  const response = await getOpenAI().embeddings.create({
    model,
    input: truncated,
  });
  return response.data[0].embedding;
}

/** Alias for retrieval paths that expect the legacy name. */
export async function generateEmbedding(text: string): Promise<number[]> {
  return embedText(text.replace(/\n/g, " "));
}

/**
 * Splits document text into chunks for embedding and storage (admin publish flow).
 */
export function chunkDocument(text: string, targetLength: number = 800): string[] {
  if (!text) return [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = "";
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > targetLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }
    currentChunk += sentence;
  }
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}

/** Batch embeddings for knowledge base chunk storage. */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const batchSize = 100;
  const allEmbeddings: number[][] = [];
  const client = getOpenAI();
  const model = process.env.EMBEDDING_MODEL ?? "text-embedding-3-small";
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize).map((t) => t.replace(/\n/g, " "));
    const response = await client.embeddings.create({
      model,
      input: batch,
    });
    const batchEmbeddings = response.data
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
    allEmbeddings.push(...batchEmbeddings);
  }
  return allEmbeddings;
}

/** Replace chunks for a document after publish (vector column via raw SQL). */
export async function storeKnowledgeBaseChunks(
  documentId: string,
  chunks: string[],
  embeddings: number[][],
  agents: string[],
  category: string,
): Promise<void> {
  await prisma.knowledgeBaseChunk.deleteMany({
    where: { documentId },
  });
  for (let i = 0; i < chunks.length; i++) {
    const embedding = embeddings[i];
    const embeddingSql = `[${embedding.join(",")}]`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO knowledge_base_chunks (id, document_id, content, chunk_index, embedding, agents, category, created_at)
       VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4::vector, $5::text[], $6, NOW())`,
      documentId,
      chunks[i],
      i,
      embeddingSql,
      agents,
      category,
    );
  }
}
