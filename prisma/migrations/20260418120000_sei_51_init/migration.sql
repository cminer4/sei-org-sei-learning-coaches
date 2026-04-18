-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "agent_type" AS ENUM ('Guide', 'Analyst', 'Builder', 'Orchestrator');

-- CreateTable
CREATE TABLE "agents" (
    "agent_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "prompt" TEXT,
    "document_tags" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agent_type" "agent_type",
    "live_research_enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("agent_id")
);

-- CreateTable
CREATE TABLE "knowledge_base_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "persona_type" TEXT,
    "content" TEXT NOT NULL,
    "agents" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "knowledge_base_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_base_chunks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_id" UUID NOT NULL,
    "content" TEXT,
    "embedding" vector,
    "chunk_index" INTEGER,
    "agents" TEXT[],
    "category" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_base_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "coach_id" UUID NOT NULL,
    "user_email" TEXT,
    "user_name" TEXT,
    "interview_config" JSONB NOT NULL,
    "transcript" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "route" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "agent_id" UUID,
    "message" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "system_events_pkey" PRIMARY KEY ("id")
);

-- voice_sessions: used by lib/voiceSessionStore (Supabase direct access; same DATABASE_URL)
CREATE TABLE "voice_sessions" (
    "id" UUID NOT NULL,
    "context" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_knowledge_base_chunks_agents" ON "knowledge_base_chunks" USING GIN ("agents");

-- CreateIndex
CREATE INDEX "idx_knowledge_base_chunks_document_id" ON "knowledge_base_chunks"("document_id");

-- CreateIndex
CREATE INDEX "idx_knowledge_base_chunks_embedding" ON "knowledge_base_chunks"("embedding");

-- AddForeignKey
ALTER TABLE "knowledge_base_chunks" ADD CONSTRAINT "knowledge_base_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "knowledge_base_documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
