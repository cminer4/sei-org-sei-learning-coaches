import { getKnowledgeProvider } from "@/lib/knowledge";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Protected API: uses knowledge factory only (no Supabase imports in this file).
 */
export async function GET() {
  try {
    const resolved = getKnowledgeProvider();
    const result = await resolved.provider.healthCheck();
    return NextResponse.json({
      kind: resolved.kind,
      ...result,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, detail: message }, { status: 500 });
  }
}
