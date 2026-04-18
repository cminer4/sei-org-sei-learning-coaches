import Anthropic from "@anthropic-ai/sdk";
import prisma from "@/lib/prisma";
import { retrieveRelevantContext } from "@/lib/retrieval";
import { logSystemEvent } from "@/lib/logSystemEvent";
import {
  getDocumentStrictness,
  getStrictnessInstruction,
  getStrictnessLabel,
} from "@/lib/strictness";
import { agentConfig } from "@/lib/agentConfig";

let anthropic: Anthropic | null = null;

function getAnthropicClient() {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("Missing ANTHROPIC_API_KEY environment variable");
    }
    anthropic = new Anthropic({
      apiKey,
    });
  }
  return anthropic;
}

export interface Message {
  role: "ai" | "user";
  text: string;
}

export interface SessionContext {
  role: string;
  company: string;
  interviewType: string;
  stage: string;
  conversationHistory: Message[];
  coachId: string;
  resumeText?: string;
  preferredName?: string;
}

export interface CoachResponseParams {
  userMessage: string;
  sessionContext: SessionContext;
}

function getWeightNote(weight: number): string {
  const w = Math.min(10, Math.max(1, weight));
  if (w <= 4) return "(Background context — use only if directly relevant)\n";
  if (w <= 5) return "(Supporting context — use when relevant)\n";
  return "(Core reference — follow this closely)\n";
}

function buildNonSpinSystemPrompt(
  agentPrompt: string | null | undefined,
  sessionContext: SessionContext,
  contextText: string,
): string {
  const basePrompt = (agentPrompt ?? "").trim();
  if (!basePrompt) {
    console.warn(
      "[coaching] missing agent.prompt, falling back to generic prompt. coachId:",
      sessionContext.coachId,
    );
  }
  const genericPrompt =
    `You are an AI coach.\n` +
    `Use the user's preferred name when available and be concise, specific, and helpful.\n`;

  return (
    `${basePrompt || genericPrompt}\n\n` +
    `USER CONTEXT:\n` +
    `Preferred name: ${sessionContext.preferredName || ""}\n` +
    `Role: ${sessionContext.role}\n` +
    `Company: ${sessionContext.company}\n` +
    `Scenario: ${sessionContext.interviewType}\n` +
    `Stage: ${sessionContext.stage}\n\n` +
    `BACKGROUND:\n${sessionContext.resumeText ? sessionContext.resumeText : "No background provided"}\n\n` +
    `KNOWLEDGE BASE CONTEXT:\n${contextText || "No specific knowledge base context found for this query."}`
  );
}

export async function generateCoachResponse(params: CoachResponseParams) {
  const { userMessage, sessionContext } = params;

  try {
    const agent = await prisma.agent.findFirst({ where: { status: "active" } });
    const agentId = agent?.id ?? "";

    const contextResults = await retrieveRelevantContext(userMessage, agentId, {
      topK: 5,
      similarityThreshold: 0.3,
      filters: {},
    });

    const groupedContext: Record<
      string,
      { instruction: string; level: number; docs: typeof contextResults }
    > = {};

    contextResults.forEach((r) => {
      const level = getDocumentStrictness({
        type: r.documentType,
        strictnessOverride: r.strictnessOverride,
      });
      const label = getStrictnessLabel(level);
      const key = `${label} (${level}%)`;

      if (!groupedContext[key]) {
        groupedContext[key] = {
          instruction: getStrictnessInstruction(level),
          level,
          docs: [],
        };
      }
      groupedContext[key].docs.push(r);
    });

    const contextText = Object.entries(groupedContext)
      .sort((a, b) => b[1].level - a[1].level)
      .map(([header, data]) => {
        const docsText = data.docs
          .map(
            (d) =>
              `[Source: ${d.documentTitle} (${d.documentType})]\n${getWeightNote(d.weight ?? 5)}${d.chunkText}`,
          )
          .join("\n\n");

        return `=== ${header.toUpperCase()} ===\n${data.instruction}\n\n${docsText}`;
      })
      .join("\n\n");

    const systemPrompt = buildNonSpinSystemPrompt(agent?.prompt, sessionContext, contextText);

    const messages: Anthropic.MessageParam[] = sessionContext.conversationHistory.map(
      (msg) => ({
        role: msg.role === "ai" ? "assistant" : "user",
        content: msg.text,
      }),
    );

    if (
      messages.length === 0 ||
      messages[messages.length - 1].content !== userMessage
    ) {
      messages.push({ role: "user", content: userMessage });
    }

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    });

    const textContent = response.content.find((c) => c.type === "text");
    const finalResponse =
      textContent && "text" in textContent
        ? textContent.text
        : "I apologize, I encountered an issue generating a response.";

    return finalResponse;
  } catch (error: unknown) {
    console.error("ERROR in generateCoachResponse:", error);
    throw error;
  }
}

export async function* streamCoachResponse(params: CoachResponseParams) {
  const { userMessage, sessionContext } = params;

  try {
    const agent = sessionContext.coachId
      ? await prisma.agent.findFirst({ where: { id: sessionContext.coachId } })
      : await prisma.agent.findFirst({ where: { status: "active" } });
    const agentId = agent?.id ?? "";

    const contextResults = await retrieveRelevantContext(userMessage, agentId, {
      topK: 5,
      similarityThreshold: 0.3,
      filters: {},
    });

    if (contextResults.length === 0) {
      try {
        await logSystemEvent({
          route: "/api/voice-llm/chat/completions",
          event_type: "rag_injection_empty",
          severity: "warn",
          message: "RAG retrieval returned no documents for voice session.",
          metadata: { agentId, turnCount: sessionContext.conversationHistory.length + 1 },
        });
      } catch {
        /* best-effort */
      }
    }

    const groupedContext: Record<
      string,
      { instruction: string; level: number; docs: typeof contextResults }
    > = {};

    contextResults.forEach((r) => {
      const level = getDocumentStrictness({
        type: r.documentType,
        strictnessOverride: r.strictnessOverride,
      });
      const label = getStrictnessLabel(level);
      const key = `${label} (${level}%)`;

      if (!groupedContext[key]) {
        groupedContext[key] = {
          instruction: getStrictnessInstruction(level),
          level,
          docs: [],
        };
      }
      groupedContext[key].docs.push(r);
    });

    const contextText = Object.entries(groupedContext)
      .sort((a, b) => b[1].level - a[1].level)
      .map(([header, data]) => {
        const docsText = data.docs
          .map(
            (d) =>
              `[Source: ${d.documentTitle} (${d.documentType})]\n${getWeightNote(d.weight ?? 5)}${d.chunkText}`,
          )
          .join("\n\n");

        return `=== ${header.toUpperCase()} ===\n${data.instruction}\n\n${docsText}`;
      })
      .join("\n\n");

    const systemPrompt = buildNonSpinSystemPrompt(agent?.prompt, sessionContext, contextText);

    const messages: Anthropic.MessageParam[] = sessionContext.conversationHistory.map(
      (msg) => ({
        role: msg.role === "ai" ? "assistant" : "user",
        content: msg.text,
      }),
    );

    if (
      messages.length === 0 ||
      messages[messages.length - 1].content !== userMessage
    ) {
      messages.push({ role: "user", content: userMessage });
    }

    const client = getAnthropicClient();
    const stream = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && "text" in chunk.delta) {
        yield chunk.delta.text;
      }
    }
  } catch (error: unknown) {
    console.error("ERROR in streamCoachResponse:", error);
    throw error;
  }
}

export async function generateKeyObjectives(
  role: string,
  company: string,
  interviewType: string,
): Promise<string[]> {
  try {
    const prompt = agentConfig.objectivesPrompt(role, company, interviewType);

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    const text =
      textContent && "text" in textContent ? textContent.text : "[]";

    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const cleanedJson = jsonMatch ? jsonMatch[0] : text;
      return JSON.parse(cleanedJson) as string[];
    } catch {
      console.error("Failed to parse objectives JSON:", text);
      return [
        "Demonstrate product knowledge",
        "Articulate value clearly",
        "Handle objections",
        "Position competitively",
      ];
    }
  } catch (error: unknown) {
    console.error("ERROR in generateKeyObjectives:", error);
    return [
      "Demonstrate product knowledge",
      "Articulate value clearly",
      "Handle objections",
      "Position competitively",
    ];
  }
}
