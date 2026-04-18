/**
 * POST /api/assessment-summary — learning summary from transcript (Assessment Agent).
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import prisma from "@/lib/prisma";
import { logSystemEvent } from "@/lib/logSystemEvent";
import { requireAuth } from "@/lib/requireAuth";

const ASSESSMENT_COACH_ID = process.env.ASSESSMENT_COACH_ID;

const FALLBACK_CRITERIA = `
## AI Assessment Learning Dimensions

### Product Knowledge
Evaluate understanding of core AI Assessment capabilities, methodology, and deliverables.

### Value Articulation
Evaluate ability to connect features to business outcomes and lead with impact.

### Objection Handling
Evaluate preparedness for common pushback: "we can do this internally", "we're not ready", "we need more data".

### Competitive Positioning
Evaluate differentiation from generic consulting, point solutions, and DIY approaches.

## Confidence Levels
- **Building**: Early understanding, needs more practice with core concepts
- **Developing**: Solid foundation, refining articulation and handling edge cases
- **Strong**: Confident across dimensions, ready for client conversations
`;

const SUMMARY_PROMPT = `You are generating a learning summary from a conversation between an SEI consultant and the AI Assessment & Strategy Agent. Use the evaluation criteria provided to structure your output.

Return valid JSON only, no preamble:

{
  "dimensions": {
    "product_knowledge":        { "summary": "", "key_takeaway": "" },
    "value_articulation":       { "summary": "", "key_takeaway": "" },
    "objection_handling":       { "summary": "", "key_takeaway": "" },
    "competitive_positioning":  { "summary": "", "key_takeaway": "" }
  },
  "covered": ["", ""],
  "revisit": ["", ""],
  "confidence": "Building | Developing | Strong"
}

Guidelines:
- Each dimension summary should be 2-3 sentences describing what was covered
- Each key_takeaway should be one actionable insight
- "covered" should list 2-3 topics that were discussed well
- "revisit" should list 2-3 areas that need more practice
- "confidence" should be exactly one of: Building, Developing, or Strong`;

function prepareForJsonParse(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  const firstBrace = s.indexOf("{");
  const lastBrace = s.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    s = s.slice(firstBrace, lastBrace + 1);
  }
  return s.trim();
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    let body: { transcript?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const transcript = body.transcript;

    if (transcript === undefined || transcript === null) {
      return NextResponse.json({ error: "transcript is required" }, { status: 400 });
    }

    const transcriptLength = typeof transcript === "string" ? transcript.length : 0;

    if (transcriptLength < 20) {
      return NextResponse.json({
        dimensions: {
          product_knowledge: {
            summary: "Session was too brief to evaluate product knowledge.",
            key_takeaway: "Try a longer session to explore the assessment methodology.",
          },
          value_articulation: {
            summary: "Not enough content to assess value articulation.",
            key_takeaway: "Practice connecting features to business outcomes.",
          },
          objection_handling: {
            summary: "No objection scenarios were covered.",
            key_takeaway: "Prepare responses for common pushback.",
          },
          competitive_positioning: {
            summary: "Competitive positioning was not discussed.",
            key_takeaway: "Learn key differentiators from consulting alternatives.",
          },
        },
        covered: ["Brief introduction"],
        revisit: ["All core learning dimensions"],
        confidence: "Building",
      });
    }

    let evalDocs: { id: string; content: string }[] = [];
    let evalError: string | null = null;

    if (ASSESSMENT_COACH_ID) {
      try {
        evalDocs = await prisma.knowledgeBaseDocument.findMany({
          where: {
            category: "evaluation_criteria",
            status: "published",
            OR: [{ agents: { has: "all" } }, { agents: { has: ASSESSMENT_COACH_ID } }],
          },
          orderBy: { weight: "desc" },
          select: { id: true, content: true },
        });
      } catch (err) {
        evalError = err instanceof Error ? err.message : String(err);
        console.error("Assessment summary: failed to fetch evaluation criteria docs", err);
        await logSystemEvent({
          route: "/api/assessment-summary",
          event_type: "eval_docs_retrieval_error",
          severity: "error",
          agent_id: ASSESSMENT_COACH_ID,
          message: "Prisma error retrieving eval docs from KB.",
          metadata: { error: evalError, agentId: ASSESSMENT_COACH_ID },
        });
      }
    }

    let criteria: string =
      evalDocs && evalDocs.length > 0 ? evalDocs.map((d) => d.content).join("\n\n") : "";

    if (!evalDocs || evalDocs.length === 0) {
      criteria = FALLBACK_CRITERIA;
      if (ASSESSMENT_COACH_ID) {
        await logSystemEvent({
          route: "/api/assessment-summary",
          event_type: "eval_docs_fallback",
          severity: "warn",
          agent_id: ASSESSMENT_COACH_ID,
          message: "No evaluation criteria docs found in KB. Fell back to hardcoded criteria.",
          metadata: { agentId: ASSESSMENT_COACH_ID },
        });
      }
    }

    const userMessage = `${criteria}\n\n<transcript>\n${String(transcript)}\n</transcript>`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Summary service is not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });
    let responseText: string;

    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: SUMMARY_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      });
      const block = response.content.find((c) => c.type === "text");
      responseText = block && "text" in block ? block.text : "";
    } catch (err) {
      console.error("Assessment summary: Anthropic API error", err);
      return NextResponse.json(
        { error: "Summary request failed. Please try again." },
        { status: 500 },
      );
    }

    const stripped = prepareForJsonParse(responseText);
    let summary: {
      confidence?: string;
      dimensions?: unknown;
      covered?: unknown;
      revisit?: unknown;
    };

    try {
      summary = JSON.parse(stripped) as typeof summary;
    } catch (parseErr) {
      console.error("Assessment summary: invalid JSON from model:", parseErr);
      return NextResponse.json({ error: "Summary response could not be parsed" }, { status: 500 });
    }

    const VALID_CONFIDENCE_VALUES = ["Building", "Developing", "Strong"] as const;
    const c = summary.confidence;
    if (
      typeof c === "string" &&
      !(VALID_CONFIDENCE_VALUES as readonly string[]).includes(c)
    ) {
      summary.confidence = "Building";
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error("[assessment-summary] fatal error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
