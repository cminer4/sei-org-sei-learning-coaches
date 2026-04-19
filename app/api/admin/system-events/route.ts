import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

const EVENTS_LIMIT = 500;
const TWENTY_FOUR_H_MS = 24 * 60 * 60 * 1000;

export interface SystemEventRow {
  id: string;
  created_at: string;
  route: string;
  event_type: string;
  severity: string;
  agent_id: string | null;
  message: string;
  metadata: Record<string, unknown> | null;
}

export interface SystemEventsResponse {
  events: SystemEventRow[];
  summary: {
    errorsLast24h: number;
    warningsLast24h: number;
    lastEventAt: string | null;
  };
}

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  try {
    const since = new Date(Date.now() - TWENTY_FOUR_H_MS).toISOString();

    const rowsDb = await prisma.systemEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: EVENTS_LIMIT,
    });

    const rows: SystemEventRow[] = rowsDb.map((row) => ({
      id: row.id,
      created_at: row.createdAt?.toISOString() ?? new Date().toISOString(),
      route: row.route,
      event_type: row.eventType,
      severity: row.severity,
      agent_id: row.agentId,
      message: row.message,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    }));

    let errorsLast24h = 0;
    let warningsLast24h = 0;
    let lastEventAt: string | null = null;
    if (rows.length > 0) {
      lastEventAt = rows[0].created_at;
      for (const row of rows) {
        if (row.created_at < since) break;
        if (row.severity === "error") errorsLast24h += 1;
        else if (row.severity === "warn") warningsLast24h += 1;
      }
    }

    const response: SystemEventsResponse = {
      events: rows,
      summary: {
        errorsLast24h,
        warningsLast24h,
        lastEventAt,
      },
    };
    return NextResponse.json(response);
  } catch (err: unknown) {
    console.error("[system-events] error:", err);
    return NextResponse.json({ error: "Failed to load system events" }, { status: 500 });
  }
}
