import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";
import { generateEmbedding } from "@/lib/embeddings";
import type {
  KnowledgeHealthResult,
  KnowledgeProvider,
  KnowledgeSearchOptions,
  RetrievalResult,
} from "./types";

/**
 * Supabase-backed knowledge. Client for health; vector search uses Prisma + pgvector.
 */
export class SupabaseKnowledgeProvider implements KnowledgeProvider {
  private client: SupabaseClient | null;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      this.client = null;
    } else {
      this.client = createClient(url, key);
    }
  }

  async healthCheck(): Promise<KnowledgeHealthResult> {
    if (!this.client) {
      return {
        ok: false,
        detail:
          "Supabase URL or anon/service key not configured (NEXT_PUBLIC_SUPABASE_URL and key env vars)",
      };
    }
    return { ok: true, detail: "Supabase client configured" };
  }

  async search(
    query: string,
    agentId: string,
    options: KnowledgeSearchOptions = {},
  ): Promise<RetrievalResult[]> {
    const {
      filters = {},
      topK = 5,
      similarityThreshold = 0.7,
    } = options;

    try {
      const queryEmbedding = await generateEmbedding(query);
      const embeddingSql = `[${queryEmbedding.join(",")}]`;

      const queryParams: unknown[] = [embeddingSql, agentId, similarityThreshold];
      const extraClauses: string[] = [];

      if (filters.documentTypes && filters.documentTypes.length > 0) {
        extraClauses.push(`d.category = ANY($${queryParams.length + 1}::text[])`);
        queryParams.push(filters.documentTypes);
      }

      const whereExtra =
        extraClauses.length > 0 ? ` AND ${extraClauses.join(" AND ")}` : "";
      const limitParam = queryParams.length + 1;
      queryParams.push(topK);

      const results = await prisma.$queryRawUnsafe<
        {
          chunkText: string;
          similarity: unknown;
          documentTitle: string;
          documentType: string;
          strictnessOverride: number | null;
          metadata: unknown;
          weight: unknown;
        }[]
      >(
        `
      SELECT 
        c.content as "chunkText",
        1 - (c.embedding <=> $1::vector) as "similarity",
        d.title as "documentTitle",
        d.category as "documentType",
        NULL::int as "strictnessOverride",
        NULL::jsonb as "metadata",
        COALESCE(d.weight, 5)::int as "weight"
      FROM knowledge_base_chunks c
      JOIN knowledge_base_documents d ON c.document_id = d.id
      WHERE d.status = 'published'
        AND (c.agents @> ARRAY['all']::text[] OR c.agents @> ARRAY[$2]::text[])
        AND 1 - (c.embedding <=> $1::vector) >= $3
        ${whereExtra}
      ORDER BY "similarity" DESC
      LIMIT $${limitParam}
      `,
        ...queryParams,
      );

      return results.map((r) => ({
        chunkText: r.chunkText,
        similarity: Number(r.similarity),
        documentTitle: r.documentTitle,
        documentType: r.documentType,
        strictnessOverride: r.strictnessOverride,
        metadata: (r.metadata as Record<string, unknown>) ?? {},
        weight: typeof r.weight === "number" ? r.weight : 5,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("ERROR in KnowledgeProvider.search:", error);
      throw new Error("Failed to retrieve relevant context: " + message);
    }
  }
}
