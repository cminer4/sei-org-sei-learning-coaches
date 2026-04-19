import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import {
  ADMIN_IMPORT_MAX_FILE_BYTES,
  ADMIN_IMPORT_PROCESSING_MS,
} from "@/lib/adminImportLimits";
import { chunkDocument, generateEmbeddings, storeKnowledgeBaseChunks } from "@/lib/embeddings";
import { logSystemEvent } from "@/lib/logSystemEvent";

const VALID_CATEGORIES = [
  "methodology",
  "buyer_persona",
  "account_intelligence",
  "sei_products",
  "sei_capabilities",
  "case_studies",
  "evaluation_criteria",
] as const;

const IMPORT_TIMEOUT_MESSAGE = "IMPORT_PROCESSING_TIMEOUT";

function withProcessingBudget<T>(p: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(IMPORT_TIMEOUT_MESSAGE)), ADMIN_IMPORT_PROCESSING_MS);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

function parseFilenameTitle(name: string): string {
  const base = name.replace(/\.[^/.]+$/, "");
  return base || "Imported document";
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const fileEntry = formData.get("file");
  if (!fileEntry || typeof fileEntry === "string") {
    return NextResponse.json({ error: "file is required (multipart field file)" }, { status: 400 });
  }

  const file = fileEntry as File;
  if (file.size > ADMIN_IMPORT_MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: `File exceeds ${ADMIN_IMPORT_MAX_FILE_BYTES} byte limit` },
      { status: 413 },
    );
  }

  const titleField = formData.get("title");
  const categoryField = formData.get("category");
  const descriptionField = formData.get("description");
  const statusField = formData.get("status");
  const agentsField = formData.get("agents");

  const title =
    typeof titleField === "string" && titleField.trim()
      ? titleField.trim()
      : parseFilenameTitle(file.name);

  const category =
    typeof categoryField === "string" && categoryField.trim()
      ? categoryField.trim()
      : "methodology";

  if (!VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  let agents: string[] = ["all"];
  if (typeof agentsField === "string" && agentsField.trim()) {
    try {
      const parsed = JSON.parse(agentsField) as unknown;
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
        agents = parsed;
      } else {
        return NextResponse.json({ error: "agents must be a JSON array of strings" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "agents must be valid JSON" }, { status: 400 });
    }
  }

  const description =
    typeof descriptionField === "string" && descriptionField.trim() ? descriptionField.trim() : null;
  const status =
    statusField === "published"
      ? "published"
      : "draft";

  try {
    const payload = await withProcessingBudget(
      (async () => {
        const content = await file.text();
        if (!content.trim()) {
          throw new Error("File is empty");
        }

        const doc = await prisma.knowledgeBaseDocument.create({
          data: {
            title,
            description,
            category,
            personaType: null,
            content,
            agents,
            weight: 5,
            status,
          },
        });

        if (status === "published" && agents.length > 0) {
          const chunks = chunkDocument(content);
          if (chunks.length > 0) {
            const embeddings = await generateEmbeddings(chunks);
            await storeKnowledgeBaseChunks(doc.id, chunks, embeddings, agents, category);
          }
        }

        await logSystemEvent({
          route: "/api/admin/documents/import",
          event_type: "admin_document_imported",
          severity: "info",
          message: `Imported document: ${doc.id}`,
          metadata: { documentId: doc.id, fileName: file.name },
        }).catch(() => {});

        return {
          id: doc.id,
          title: doc.title,
          description: doc.description,
          category: doc.category,
          status: doc.status,
          createdAt: doc.createdAt.toISOString(),
        };
      })(),
    );

    return NextResponse.json(payload);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === IMPORT_TIMEOUT_MESSAGE) {
      return NextResponse.json(
        { error: "Import processing exceeded 30 seconds. Try a smaller file or save as draft first." },
        { status: 408 },
      );
    }
    console.error("Import failed:", err);
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
