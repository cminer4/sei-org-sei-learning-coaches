import { NextRequest } from "next/server";
import { streamCoachResponse, type Message } from "@/lib/coaching";
import { logSystemEvent } from "@/lib/logSystemEvent";
import prisma from "@/lib/prisma";
import { verifyCustomLlmBearer } from "@/lib/customLlmAuth";

export async function GET() {
  return new Response("OK", { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const expectedKey = process.env.INTERVIEW_COACH_CUSTOM_LLM_API_KEY;

    if (!expectedKey) {
      console.error("ERROR: INTERVIEW_COACH_CUSTOM_LLM_API_KEY is not set");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!verifyCustomLlmBearer(authHeader, expectedKey)) {
      console.warn("Unauthorized request attempt to Custom LLM");
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const body = await req.json();
    const { messages, dynamic_variables: dynamicVariables } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
      });
    }

    const lastMessage = messages[messages.length - 1];
    let userMessage = "";

    if (typeof lastMessage.content === "string") {
      userMessage = lastMessage.content;
    } else if (Array.isArray(lastMessage.content)) {
      const textPart = lastMessage.content.find((p: { type?: string }) => p.type === "text");
      userMessage = textPart?.text || "";
    }

    const conversationHistory: Message[] = messages
      .slice(0, -1)
      .filter((m: { role?: string }) => m.role !== "system")
      .map((m: { role?: string; content?: unknown }) => {
        let content = "";
        if (typeof m.content === "string") {
          content = m.content;
        } else if (Array.isArray(m.content)) {
          const textPart = m.content.find((p: { type?: string }) => p.type === "text");
          content = textPart?.text || "";
        }
        const role: "ai" | "user" = m.role === "assistant" ? "ai" : "user";
        return { role, text: content };
      });

    const { getLatestSessionContext } = await import("@/lib/voiceSessionStore");
    const storedContext = (await getLatestSessionContext()) as {
      agentId?: string;
      role?: string;
      company?: string;
      interviewType?: string;
      preferredName?: string;
      resumeText?: string;
    } | null;

    const fallbackAgentId = process.env.ASSESSMENT_COACH_ID ?? "";
    const agentId = storedContext?.agentId || fallbackAgentId;

    const agent = agentId
      ? await prisma.agent.findFirst({ where: { id: agentId } })
      : await prisma.agent.findFirst({ where: { status: "active" } });

    const sessionContext = {
      role: storedContext?.role || dynamicVariables?.target_role || "Consultant",
      company: storedContext?.company || dynamicVariables?.target_company || "SEI",
      interviewType: storedContext?.interviewType || "AI Assessment Learning",
      stage: "Initial",
      conversationHistory,
      coachId: agent?.id ?? agentId,
      preferredName: storedContext?.preferredName || dynamicVariables?.user_name || "",
      resumeText: storedContext?.resumeText || "",
    };

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamCoachResponse({
            userMessage,
            sessionContext,
          })) {
            const data = {
              choices: [{ delta: { content: chunk } }],
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err: unknown) {
          console.error("Streaming error in Custom LLM route:", err);
          try {
            await logSystemEvent({
              route: "/api/voice-llm/chat/completions",
              event_type: "voice_llm_failure",
              severity: "error",
              message: "Voice LLM completion failed.",
              metadata: {
                error: err instanceof Error ? err.message : String(err),
              },
            });
          } catch {
            /* ignore */
          }
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    console.error("Error in /api/voice-llm:", error);
    try {
      await logSystemEvent({
        route: "/api/voice-llm/chat/completions",
        event_type: "voice_llm_failure",
        severity: "error",
        message: "Voice LLM completion failed.",
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    } catch {
      /* ignore */
    }
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500 },
    );
  }
}
