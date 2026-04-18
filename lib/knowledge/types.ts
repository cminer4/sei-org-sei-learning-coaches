/** Result of a lightweight knowledge subsystem check (no DB round-trip required for MVP). */
export type KnowledgeHealthResult = {
  ok: boolean;
  detail?: string;
};

export interface RetrievalFilter {
  roles?: string[];
  stages?: string[];
  documentTypes?: string[];
}

export interface RetrievalResult {
  chunkText: string;
  similarity: number;
  documentTitle: string;
  documentType: string;
  strictnessOverride: number | null;
  metadata: Record<string, unknown>;
  /** Document adherence weight 1-10 */
  weight: number;
}

export type KnowledgeSearchOptions = {
  filters?: RetrievalFilter;
  topK?: number;
  similarityThreshold?: number;
};

export interface KnowledgeProvider {
  healthCheck(): Promise<KnowledgeHealthResult>;
  search(
    query: string,
    agentId: string,
    options?: KnowledgeSearchOptions,
  ): Promise<RetrievalResult[]>;
}
