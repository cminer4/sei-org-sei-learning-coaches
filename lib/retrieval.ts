import { getKnowledgeProvider } from "@/lib/knowledge/factory";
import type {
  KnowledgeSearchOptions,
  RetrievalFilter,
  RetrievalResult,
} from "@/lib/knowledge/types";

export type { RetrievalFilter, RetrievalResult };

/**
 * Retrieves relevant context chunks via the configured KnowledgeProvider (not direct Supabase).
 */
export async function retrieveRelevantContext(
  query: string,
  agentId: string,
  options: KnowledgeSearchOptions = {},
): Promise<RetrievalResult[]> {
  const { provider } = getKnowledgeProvider();
  return provider.search(query, agentId, options);
}
