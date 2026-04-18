import { AZURE_KNOWLEDGE_STUB_MESSAGE } from "./constants";
import type { KnowledgeHealthResult, KnowledgeProvider } from "./types";

/**
 * Azure-backed knowledge (stub). Every operation throws until SEI Azure data source exists.
 */
export class AzureKnowledgeProvider implements KnowledgeProvider {
  async healthCheck(): Promise<KnowledgeHealthResult> {
    throw new Error(AZURE_KNOWLEDGE_STUB_MESSAGE);
  }
}
