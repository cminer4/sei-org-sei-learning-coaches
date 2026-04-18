import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { generateKeyObjectives, generateCoachResponse } from "@/lib/coaching";
import { logSystemEvent } from "@/lib/logSystemEvent";
import { requireAuth } from "@/lib/requireAuth";

function defaultCoachId(): string {
  const id = process.env.ASSESSMENT_COACH_ID;
  if (!id) {
    throw new Error("ASSESSMENT_COACH_ID must be set for onboarding sessions");
  }
  return id;
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const body = await req.json();
    const {
      sessionId,
      role,
      company,
      resumeText,
      interviewType,
      preferredName,
    } = body as Record<string, unknown>;

    const coachId = defaultCoachId();

    let session;

    if (sessionId && typeof sessionId === "string") {
      session = await prisma.session.update({
        where: { id: sessionId },
        data: {
          interviewConfig: {
            ...(body as Record<string, unknown>),
            updatedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });
    } else {
      session = await prisma.session.create({
        data: {
          coachId,
          interviewConfig: {
            ...body,
            createdAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });
    }

    const preProcessedData: Record<string, unknown> = {
      ...((session.interviewConfig as Record<string, unknown>) || {}),
    };
    let needsUpdate = false;

    if (
      role &&
      company &&
      interviewType &&
      typeof role === "string" &&
      typeof company === "string" &&
      typeof interviewType === "string" &&
      !preProcessedData.objectives
    ) {
      const objectives = await generateKeyObjectives(role, company, interviewType);
      preProcessedData.objectives = objectives;
      needsUpdate = true;
    }

    if (
      role &&
      company &&
      interviewType &&
      typeof role === "string" &&
      typeof company === "string" &&
      typeof interviewType === "string" &&
      !preProcessedData.initialGreeting
    ) {
      const initialGreeting = await generateCoachResponse({
        userMessage: "Hello, I am ready to start my interview practice.",
        sessionContext: {
          role: role || "Candidate",
          company: company || "Target Company",
          interviewType: interviewType || "Interview",
          stage: interviewType || "Initial",
          conversationHistory: [],
          coachId,
          resumeText: typeof resumeText === "string" ? resumeText : "",
          preferredName: typeof preferredName === "string" ? preferredName : "",
        },
      });
      preProcessedData.initialGreeting = initialGreeting;
      needsUpdate = true;
    }

    if (needsUpdate) {
      session = await prisma.session.update({
        where: { id: session.id },
        data: {
          interviewConfig: preProcessedData as Prisma.InputJsonValue,
        },
      });
    }

    return NextResponse.json({
      sessionId: session.id,
      preProcessedData,
    });
  } catch (error: unknown) {
    console.error("Error in /api/onboarding/session:", error);
    try {
      await logSystemEvent({
        route: "/api/onboarding/session",
        event_type: "onboarding_session_failure",
        severity: "error",
        message: "Failed to create onboarding session.",
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    } catch {
      /* ignore */
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process onboarding step",
      },
      { status: 500 },
    );
  }
}
