import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { agentConfig } from "@/lib/agentConfig";

/**
 * GET /api/admin/agent-config
 * Safe fields for Prompt Control context (no secrets).
 */
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const objectivesSample = agentConfig.objectivesPrompt(
    "Account Executive",
    "Acme Corp",
    "Discovery conversation",
  );

  return NextResponse.json({
    fullTitle: agentConfig.fullTitle,
    persona: agentConfig.persona,
    systemInstructions: agentConfig.systemInstructions,
    initialMessage: agentConfig.initialMessage,
    fallbackGreeting: agentConfig.fallbackGreeting,
    objectivesPromptSample: objectivesSample,
    contextLabel: agentConfig.contextLabel,
    contextTypes: agentConfig.onboarding.contextTypes,
    userNoun: agentConfig.userNoun,
    sessionNoun: agentConfig.sessionNoun,
  });
}
