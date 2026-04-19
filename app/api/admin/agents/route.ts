import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

/**
 * List all agents for admin Prompt Control and Knowledge Base assignment.
 */
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  try {
    const agents = await prisma.agent.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        prompt: true,
        documentTags: true,
        status: true,
        agentType: true,
        liveResearchEnabled: true,
        createdAt: true,
      },
    });
    const payload = agents.map((a) => ({
      id: a.id,
      agent_id: a.id,
      name: a.name,
      prompt: a.prompt ?? null,
      document_tags: a.documentTags ?? [],
      status: a.status,
      agent_type: a.agentType != null ? String(a.agentType) : null,
      live_research_enabled: a.liveResearchEnabled,
      created_at: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
    }));
    return NextResponse.json(payload);
  } catch (error: unknown) {
    console.error("Error fetching agents:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to fetch agents.", detail: message },
      { status: 500 },
    );
  }
}
