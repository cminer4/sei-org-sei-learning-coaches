import { NextRequest, NextResponse } from "next/server";
import { storeSessionContext } from "@/lib/voiceSessionStore";
import { logSystemEvent } from "@/lib/logSystemEvent";
import { randomUUID } from "crypto";
import { requireAuth } from "@/lib/requireAuth";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const body = await req.json().catch(() => ({}));

    const elevenLabsAgentId = process.env.ELEVENLABS_ASSESSMENT_AGENT_ID;
    const databaseAgentId = process.env.ASSESSMENT_COACH_ID;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenLabsAgentId || !apiKey) {
      console.error("Missing ElevenLabs credentials in environment.");
      return NextResponse.json({ error: "Missing ElevenLabs credentials" }, { status: 500 });
    }

    if (!databaseAgentId) {
      console.error("ASSESSMENT_COACH_ID is not set");
      return NextResponse.json({ error: "Assessment agent not configured" }, { status: 500 });
    }

    const sessionId = randomUUID();

    const contextToStore = {
      preferredName: (body as { user_name?: string }).user_name || "Consultant",
      agentId: databaseAgentId,
      role: "Consultant",
      company: (body as { company?: string }).company || "",
      resumeText: (body as { resumeText?: string }).resumeText || "",
      interviewType: "AI Assessment Learning",
    };

    await storeSessionContext(sessionId, contextToStore);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${encodeURIComponent(elevenLabsAgentId)}&include_conversation_id=true`,
      {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API returned error:", errorText);
      const err = new Error(`ElevenLabs API error: ${errorText}`);
      (err as { status?: number }).status = response.status;
      throw err;
    }

    const data = (await response.json()) as {
      signed_url?: string;
      conversation_id?: string;
    };
    const signedUrl = data.signed_url;
    if (!signedUrl) {
      return NextResponse.json({ error: "Invalid ElevenLabs response" }, { status: 502 });
    }
    const url = new URL(signedUrl);
    const conversationId =
      url.searchParams.get("conversation_id") ?? data.conversation_id ?? undefined;

    return NextResponse.json({ signedUrl, sessionId, conversationId });
  } catch (error: unknown) {
    console.error("Error in /api/elevenlabs-signed-url:", error);
    try {
      await logSystemEvent({
        route: "/api/elevenlabs-signed-url",
        event_type: "elevenlabs_signed_url_failure",
        severity: "error",
        message: "Failed to fetch ElevenLabs signed URL.",
        metadata: {
          agentId: process.env.ELEVENLABS_ASSESSMENT_AGENT_ID,
          status: (error as { status?: number }).status,
          error: error instanceof Error ? error.message : String(error),
        },
      });
    } catch {
      /* ignore */
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
