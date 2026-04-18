import OpenAI from "openai";

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
