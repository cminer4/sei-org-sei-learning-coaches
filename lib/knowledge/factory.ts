import { AzureKnowledgeProvider } from "./azure-provider";
import { SupabaseKnowledgeProvider } from "./supabase-provider";

export type ResolvedKnowledgeProvider =
  | { kind: "supabase"; provider: SupabaseKnowledgeProvider }
  | { kind: "azure"; provider: AzureKnowledgeProvider };

function resolveProviderKind(): "supabase" | "azure" {
  const raw = process.env.KNOWLEDGE_PROVIDER?.toLowerCase().trim();
  const normalized = raw === undefined || raw === "" ? "supabase" : raw;
  if (normalized !== "supabase" && normalized !== "azure") {
    throw new Error(
      `Invalid KNOWLEDGE_PROVIDER "${normalized}". Use "supabase" or "azure".`,
    );
  }
  return normalized;
}

/**
 * Returns the configured knowledge provider. Callers outside `lib/knowledge/` should use
 * this factory instead of importing `@supabase/supabase-js` for knowledge access.
 */
export function getKnowledgeProvider(): ResolvedKnowledgeProvider {
  const kind = resolveProviderKind();
  if (kind === "supabase") {
    return { kind: "supabase", provider: new SupabaseKnowledgeProvider() };
  }
  return { kind: "azure", provider: new AzureKnowledgeProvider() };
}
