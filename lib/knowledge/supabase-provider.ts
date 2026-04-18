import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { KnowledgeHealthResult, KnowledgeProvider } from "./types";

/**
 * Supabase-backed knowledge. Client is created only inside this module (not in app routes).
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
}
