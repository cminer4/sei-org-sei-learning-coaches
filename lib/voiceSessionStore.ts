import { createClient } from "@supabase/supabase-js";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function storeSessionContext(sessionId: string, context: unknown) {
  const supabase = getClient();
  if (!supabase) {
    console.warn("[voiceSessionStore] missing Supabase env, skip store");
    return;
  }
  const { error } = await supabase
    .from("voice_sessions")
    .insert({ id: sessionId, context });
  if (error) console.error("Failed to store voice session:", error);
}

export async function getSessionContext(sessionId: string): Promise<unknown | null> {
  const supabase = getClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("voice_sessions")
    .select("context")
    .eq("id", sessionId)
    .single();
  if (error || !data) return null;
  return data.context;
}

export async function deleteSessionContext(sessionId: string) {
  const supabase = getClient();
  if (!supabase) return;
  await supabase.from("voice_sessions").delete().eq("id", sessionId);
}

export async function getLatestSessionContext(): Promise<unknown | null> {
  const supabase = getClient();
  if (!supabase) {
    console.log("No voice session context (Supabase not configured)");
    return null;
  }
  const { data, error } = await supabase
    .from("voice_sessions")
    .select("context")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (error || !data) {
    console.log("No voice session context found in Supabase");
    return null;
  }
  console.log("Found latest voice session context");
  return data.context;
}
