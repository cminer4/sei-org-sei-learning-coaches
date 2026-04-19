import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { retrieveRelevantContext } from "@/lib/retrieval";

export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  try {
    const body = await req.json();
    const {
      query,
      agentId: bodyAgentId,
      filters,
      topK = 5,
      similarityThreshold = 0.6,
    } = body;

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    let agentId = bodyAgentId as string | undefined;
    if (!agentId) {
      const agent = await prisma.agent.findFirst({
        where: { status: "active" },
      });
      if (!agent) {
        return NextResponse.json({ error: "No active agent found" }, { status: 404 });
      }
      agentId = agent.id;
    }

    const results = await retrieveRelevantContext(query, agentId, {
      filters,
      topK,
      similarityThreshold,
    });

    return NextResponse.json(results);
  } catch (error: unknown) {
    console.error("Error in retrieval API:", error);
    return NextResponse.json({ error: "Failed to retrieve context" }, { status: 500 });
  }
}
