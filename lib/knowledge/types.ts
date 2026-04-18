/** Result of a lightweight knowledge subsystem check (no DB round-trip required for MVP). */
export type KnowledgeHealthResult = {
  ok: boolean;
  detail?: string;
};

/** Minimal surface for SEI-50; extend when retrieval is ported. */
export interface KnowledgeProvider {
  healthCheck(): Promise<KnowledgeHealthResult>;
}
