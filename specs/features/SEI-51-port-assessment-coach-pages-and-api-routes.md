---
linear: https://linear.app/sei-interview-app/issue/SEI-51
ticket: SEI-51
---

# Feature Specification: Port Assessment Coach pages and API routes

**Feature Branch**: `SEI-51-port-assessment-coach-pages-and-api-routes`  
**Created**: 2026-04-18  
**Status**: Draft  
**Linear Ticket**: [SEI-51](https://linear.app/sei-interview-app/issue/SEI-51)  
**Input**: User description: "SEI-51: Port Assessment Coach pages and API routes. Goal: Port the Assessment Coach pages, API routes, and core lib files from sei-sales-coach into the new repo. Auth must be wired into every route -- no STUB_USER_ID."

**Auth note**: User-session protection uses `auth()` on all listed API routes **except** the Custom LLM endpoint used by ElevenLabs (see **FR-002**). There are **no** public webhooks or unauthenticated HTTP callbacks in this architecture.

**Reference repo (read-only)**: `~/Documents/sei-sales-coach`. **Target**: this workspace (`sei-learning-coaches`), following [CLAUDE.md](../../CLAUDE.md) directory contract and Assessment domain (onboarding, practice, learning summary; not SPIN).

## User Scenarios & Testing (mandatory)

### User Story 1 - Land on Assessment onboarding (Priority: P1)

A consultant opens the app root and is taken to the Assessment onboarding flow, then can proceed to practice and the learning summary using ported pages under `/guide/assessment`.

**Why this priority**: Delivers the primary entry and happy path for the Assessment Coach product in this repo.

**Independent Test**: Visit `/` and confirm redirect to `/guide/assessment`; complete onboarding UI on `app/guide/assessment/page.tsx` without errors.

**Acceptance Scenarios**:

1. **Given** a user visits `/`, **When** the root page loads, **Then** they are redirected to `/guide/assessment` (implementation may use Next.js `redirect` or equivalent consistent with App Router patterns).
2. **Given** the user is on `/guide/assessment`, **When** they complete onboarding per ported behavior, **Then** they can navigate to session and summary routes without importing SPIN-only modules.

### User Story 2 - Voice and text practice with ported APIs (Priority: P1)

A signed-in consultant runs a practice session (voice via `AssessmentVoiceCoach.tsx` and text as ported) using API routes that match the reference app’s contracts, with knowledge retrieval via `getKnowledgeProvider()`.

**Why this priority**: Core teaching loop depends on LLM, ElevenLabs, onboarding session, and summary APIs.

**Independent Test**: With valid auth and env, complete a short session and generate a summary; verify no direct Supabase calls in `retrieval.ts` for search (uses provider).

**Acceptance Scenarios**:

1. **Given** appropriate credentials (see **FR-002**), **When** code calls the Custom LLM completions route, ElevenLabs-related routes, onboarding session, and assessment-summary APIs, **Then** handlers run and align with [CLAUDE.md](../../CLAUDE.md) voice and learning-summary integrity rules (confidence values, session consistency).
2. **Given** `retrieval.ts` is invoked, **When** search runs, **Then** it uses `getKnowledgeProvider().search()` (not direct Supabase client calls).

### User Story 3 - Callers without proper credentials are rejected (Priority: P2)

User-session routes reject anonymous callers; the Custom LLM route rejects requests without the service Bearer token.

**Why this priority**: Required for security and alignment with no stub identities.

**Independent Test**: For `elevenlabs-signed-url`, `elevenlabs-conversation-transcript`, `onboarding/session`, and `assessment-summary`, call without a session and expect 401 (or equivalent). For `voice-llm/chat/completions`, call without `Authorization: Bearer` matching `INTERVIEW_COACH_CUSTOM_LLM_API_KEY` and expect 401.

**Acceptance Scenarios**:

1. **Given** no valid session, **When** any user-session API route from **FR-002** is invoked (all except Custom LLM), **Then** `auth()` prevents handler execution (e.g. 401).
2. **Given** the Custom LLM route is called, **When** the `Authorization` Bearer token does not match the configured API key, **Then** the handler does not run business logic (e.g. 401).

### Edge Cases

- Reference imports from excluded folders (`coach/`, `assessment-builder/`, `geopoliticalBrief/`, SPIN `VoiceCoach.tsx`): port only what in-scope files need; extract minimal shared code if required.
- `coaching.ts` after SPIN removal: ensure no dead imports or unreachable branches; Assessment-only path remains.
- Env and URL parity: if this repo’s `app/api/` paths differ from reference, document deltas so clients and tests stay correct.
- Prisma: fresh `migrate dev` on empty dev DB; no `db push` for this feature.

## Requirements (mandatory)

### Functional Requirements

- **FR-001**: **Pages** — Port and wire: `app/guide/assessment/page.tsx` (onboarding), `app/guide/assessment/session/page.tsx` (voice session), `app/guide/assessment/summary/page.tsx` (learning summary), and `app/page.tsx` **redirecting** to `/guide/assessment`.
- **FR-002**: **API routes** — Port routes for: `voice-llm/chat/completions`, `elevenlabs-signed-url`, `elevenlabs-conversation-transcript`, `onboarding/session`, `assessment-summary` (under `app/api/` following reference segment structure). **(a)** `voice-llm/chat/completions` (ElevenLabs Custom LLM): MUST NOT use `auth()`. ElevenLabs calls this endpoint with a **Bearer token**; the handler MUST validate `Authorization: Bearer <token>` against the `INTERVIEW_COACH_CUSTOM_LLM_API_KEY` environment variable (or project-standard constant-time comparison). Requests with missing or wrong token MUST NOT execute handler logic (e.g. 401). **(b)** `elevenlabs-signed-url`, `elevenlabs-conversation-transcript`, `onboarding/session`, `assessment-summary`: MUST call `auth()` before business logic; unauthenticated requests MUST NOT run authenticated logic. No `STUB_USER_ID`. There are no public webhooks and no unauthenticated user callbacks in this architecture.
- **FR-003**: **Lib direct copy** — `embeddings.ts`, `logSystemEvent.ts`, `prompts.ts`, `scoringPrompts.ts`, `voiceSessionStore.ts`, `agents.ts`, `agentConfig.ts`, `prisma.ts` (paths under `lib/` per reference; adjust imports for this repo only).
- **FR-004**: **Lib modified** — `coaching.ts`: remove SPIN branch; keep non-SPIN (Assessment) path only. `retrieval.ts`: replace direct Supabase usage with `getKnowledgeProvider().search()` (and related provider surface as needed).
- **FR-005**: **Components** — Port `AssessmentVoiceCoach.tsx` (not `VoiceCoach.tsx`).
- **FR-006**: **Prisma** — Schema limited to: `agents`, `knowledge_base_documents`, `knowledge_base_chunks`, `sessions`, `system_events`. Apply changes with **`prisma migrate dev`**, not `db push`.
- **FR-007**: **Exclusions** — Do not port or depend on: `coach/`, `assessment-builder/`, `geopoliticalBrief/`, or SPIN `VoiceCoach.tsx`.
- **FR-008**: **Tests** — New and ported logic MUST follow TDD per [CLAUDE.md](../../CLAUDE.md) (failing tests first; coverage targets for new code).

### Key Entities (if feature involves data)

- **Agent**: Prompt and config rows used by Assessment (Prisma `agents` table).
- **KnowledgeBaseDocument / KnowledgeBaseChunk**: RAG source metadata and chunks (`knowledge_base_documents`, `knowledge_base_chunks`).
- **Session**: Practice session storage aligned with onboarding and summary (`sessions`).
- **SystemEvent**: Auditing or telemetry events (`system_events`).

### Non-Functional Requirements

- **NFR-001**: **Product integrity** — Learning summaries remain Assessment-style (teaching feedback, confidence `Building` | `Developing` | `Strong` only), not SPIN scorecards, per [CLAUDE.md](../../CLAUDE.md).
- **NFR-002**: **Security** — No stub user IDs; secrets only via environment variables; document `INTERVIEW_COACH_CUSTOM_LLM_API_KEY` and other new env vars when porting APIs. Custom LLM key is a server-side secret; never expose it to the browser.

## Success Criteria (mandatory)

### Measurable Outcomes

- **SC-001**: `/` redirects to `/guide/assessment`; all three Assessment pages load and connect to ported flows.
- **SC-002**: Four user-session API areas enforce `auth()`; Custom LLM route enforces Bearer token match to `INTERVIEW_COACH_CUSTOM_LLM_API_KEY`; manual or automated checks show 401 (or equivalent) without valid credentials; grep shows no `STUB_USER_ID` in ported paths.
- **SC-003**: `npm run lint` and `npm run build` pass; tests pass with TDD coverage for new critical logic.
- **SC-004**: Prisma migrations apply via `migrate dev` on a clean database with only scoped models; no `db push` used for this work.
- **SC-005**: No imports from excluded directories or SPIN `VoiceCoach.tsx`; `retrieval.ts` uses knowledge provider, not direct Supabase for specified search path.
