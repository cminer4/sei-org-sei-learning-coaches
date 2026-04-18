import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";

type TranscriptEntry = {
  source?: string;
  role?: string;
  type?: string;
  message?: string;
  text?: string;
  content?: string;
  [key: string]: unknown;
};

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ElevenLabs API not configured" }, { status: 500 });
  }

  let body: { conversationId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const conversationId = body.conversationId?.trim();
  if (!conversationId) {
    return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${encodeURIComponent(conversationId)}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
      },
    );

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            response.status === 404
              ? "Conversation not found or transcript not ready yet."
              : "Failed to fetch transcript.",
        },
        { status: response.status === 404 ? 404 : 502 },
      );
    }

    const data = JSON.parse(text) as {
      status?: string;
      transcript?: TranscriptEntry[];
    };
    if (data.status === "processing" || data.status === "in-progress") {
      return NextResponse.json({ transcript: "" }, { status: 202 });
    }
    const rawTranscript: TranscriptEntry[] = Array.isArray(data.transcript) ? data.transcript : [];

    const lines = rawTranscript.map((entry) => {
      const lineText = entry.message ?? entry.text ?? entry.content ?? "";
      const source = (entry.source ?? entry.role ?? entry.type ?? "").toLowerCase();
      const isAgent = source === "agent" || source === "ai" || source === "assistant";
      const prefix = isAgent ? "Coach:" : "Rep:";
      return `${prefix} ${String(lineText).trim()}`;
    });

    const transcript = lines.filter(Boolean).join("\n\n");
    return NextResponse.json({ transcript });
  } catch (err) {
    console.error("[elevenlabs-conversation-transcript] Error:", err);
    return NextResponse.json({ error: "Failed to fetch transcript." }, { status: 500 });
  }
}
