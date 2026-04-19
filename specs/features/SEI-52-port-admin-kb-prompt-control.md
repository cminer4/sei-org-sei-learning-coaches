---
linear: https://linear.app/sei-interview-app/issue/SEI-52
ticket: SEI-52
---

# Feature Specification: Port admin (KB management, Prompt Control, System Health, Test Console)

**Feature Branch**: `SEI-52-port-admin-kb-prompt-control`  
**Created**: 2026-04-18  
**Status**: Draft  
**Linear Ticket**: [SEI-52](https://linear.app/sei-interview-app/issue/SEI-52)  
**Input**: User description: "SEI-52: Port admin (KB management + Prompt Control). Goal: Port the admin surface -- KB management, Prompt Control, System Health, Test Console -- with auth-gated routes."

**Reference repo (read-only)**: `~/Documents/sei-sales-coach`. **Target**: this workspace (`sei-learning-coaches`), following [CLAUDE.md](../../CLAUDE.md) directory contract. Admin is for **internal operators** managing the knowledge base and Assessment agent prompts; it is not the learner-facing `/guide/assessment` flow.

## Resolved decisions (this ticket)

| Topic | Decision |
|-------|----------|
| **`ADMIN_EMAILS` format** | Single comma-separated string of **lowercase** email addresses (e.g. `cminer@sei.com,amanueco@sei.com`). **Runtime comparison is case-insensitive** (normalize session email and list entries before compare). |
| **Permissive default** | If **`ADMIN_EMAILS` is unset or empty**, **any authenticated user** may access `/admin` and `/api/admin/*` (permissive default for internal pilot). When set, only listed emails pass the admin check after `auth()`. |
| **Import (`/api/admin/documents/import`)** | **Max file size 10 MB** (match sei-sales-coach). **Processing timeout 30 seconds**; if exceeded, respond with **408** and a clear error message. **No chunked streaming** for import responses. |
| **Concurrent edits** | **Last-write-wins**. **No optimistic locking** in this ticket. **Known limitation** (same class of note as concurrent voice session context in [SEI-51 review](../SEI-51-port-assessment-coach-pages-and-api-routes/review-2026-04-18.md)): two operators editing the same document or prompt may overwrite each other; acceptable for pilot scope. |

## User Scenarios & Testing (mandatory)

### User Story 1 - Operator manages knowledge documents (Priority: P1)

An authorized internal user opens Admin, uses Knowledge Base to add, edit, or remove documents (and chunks as the reference UI provides), and sees changes reflected in retrieval used by the Assessment Coach.

**Why this priority**: Without KB CRUD, content cannot be maintained without database access.

**Independent Test**: Sign in as an allowed admin user, perform add / edit / delete on a test document, confirm persistence and that Test Console retrieval returns expected chunks.

**Acceptance Scenarios**:

1. **Given** an authenticated user allowed to use admin, **When** they create or update a document via the ported APIs, **Then** the document appears in list/detail views and stored data matches the reference app’s behavior.
2. **Given** an authenticated admin, **When** they delete a document (if supported by reference), **Then** it is removed and retrieval no longer surfaces its chunks.

### User Story 2 - Operator edits Assessment agent prompt (Priority: P1)

An authorized user opens Prompt Control, loads the agent row, edits the system prompt, and saves; the Assessment Coach uses the updated prompt from the database per [CLAUDE.md](../../CLAUDE.md) single source of truth.

**Why this priority**: Prompt Control is the contract for coach behavior; must not be bypassed by scattered hardcoded strings.

**Independent Test**: Change prompt text, save, confirm via API or a minimal coach path that reads `agents.prompt`.

**Acceptance Scenarios**:

1. **Given** an authenticated admin, **When** they save a prompt in Prompt Control, **Then** the `agents` record updates and subsequent reads return the new value.

### User Story 3 - Operator monitors health and tests retrieval (Priority: P2)

An authorized user views System Health and uses Test Console to run a retrieval query against the current KB and see results (for debugging content and embeddings).

**Why this priority**: Reduces time to diagnose bad answers or missing chunks without production deploys.

**Independent Test**: Open Test Console, submit a query, verify results match `getKnowledgeProvider()` / admin retrieve behavior.

**Acceptance Scenarios**:

1. **Given** an authenticated admin, **When** they use Test Console, **Then** retrieval results display consistently with server-side search semantics.

### User Story 4 - Unauthenticated and unauthorized access is blocked (Priority: P1)

Anonymous users cannot call admin APIs or load admin pages. Optionally, signed-in users who are **not** admins cannot use the admin surface.

**Why this priority**: Prevents outsiders or general consultants from changing prompts or KB content.

**Independent Test**: Call each admin API without a session (expect **401**). When `ADMIN_EMAILS` is set, sign in as a non-listed user and expect **403** on `/admin` and `/api/admin/*`. When `ADMIN_EMAILS` is unset, any signed-in user should reach admin (permissive pilot).

**Acceptance Scenarios**:

1. **Given** no valid session, **When** any admin API route is invoked, **Then** the handler does not run protected logic (e.g. **401**).
2. **Given** `ADMIN_EMAILS` is **non-empty**, **When** a signed-in user whose email is **not** in the list (after case-insensitive match) accesses admin, **Then** they cannot perform admin actions (**403** or redirect with no sensitive data).
3. **Given** `ADMIN_EMAILS` is **unset or empty**, **When** any authenticated user opens admin, **Then** they may use admin (permissive default for internal pilot).

### Edge Cases

- **Import over limit or timeout**: Reject uploads **> 10 MB** with a clear **4xx** (e.g. **413**). If processing exceeds **30 seconds**, return **408** with a clear message; do not use chunked streaming for import responses.
- **Concurrent edits**: **Last-write-wins**; no optimistic locking. Documented **known limitation** for this ticket (operators may overwrite each other), same pattern as documenting concurrent-use limits elsewhere (e.g. SEI-51 voice session concurrency notes).
- **Azure vs Supabase knowledge provider**: admin retrieve/test paths must use the same `getKnowledgeProvider()` contract as the learner app when applicable.

## Requirements (mandatory)

### Functional Requirements

- **FR-001**: **Pages** — Port `app/admin/page.tsx` and `app/admin/test-retrieval/page.tsx`, composing the ported admin tab components. Routes live under `app/admin/` per App Router.
- **FR-002**: **Components** — Port `components/admin/KnowledgeBaseTab.tsx`, `PromptControlTab.tsx`, `SystemHealthTab.tsx`, `TestConsoleTab.tsx`. Adjust imports for this repo; do not import SPIN-only or out-of-scope modules (`coach/`, `assessment-builder/` unless explicitly required by these tabs and approved).
- **FR-003**: **API routes** — Port and wire:
  - `app/api/admin/agents/route.ts`
  - `app/api/admin/agents/[id]/route.ts`
  - `app/api/admin/documents/route.ts`
  - `app/api/admin/documents/[id]/route.ts`
  - `app/api/admin/documents/import/route.ts`
  - `app/api/admin/retrieve/route.ts`
  - `app/api/admin/agent-config/route.ts`
  - `app/api/admin/system-events/route.ts`  
  Each route MUST call **`auth()`** before business logic. Unauthenticated requests MUST NOT mutate or read sensitive admin data (return **401** or project-standard equivalent).
- **FR-004**: **Admin authorization** — Environment variable **`ADMIN_EMAILS`**: comma-separated **lowercase** email addresses (example: `cminer@sei.com,amanueco@sei.com`). **Case-insensitive** comparison at runtime against the signed-in user’s email. If **`ADMIN_EMAILS` is unset or empty**, **any authenticated user** may access admin (permissive default for internal pilot). If **`ADMIN_EMAILS` is set**, only matching users may access `/admin` and `/api/admin/*`; others MUST receive **403** (or redirect with no data leak). Implement in shared helper used by middleware and/or page layouts and API routes.
- **FR-004a**: **Document import** — `POST /api/admin/documents/import` MUST enforce **10 MB** max upload size (sei-sales-coach pattern). MUST use a **30 second** processing timeout; on timeout return **408** with a clear error message. MUST NOT use chunked streaming for the import response body.
- **FR-005**: **Middleware** — Extend route protection so `/admin` and `/api/admin/*` require **authentication** first; then apply **FR-004** allowlist when `ADMIN_EMAILS` is non-empty.
- **FR-006**: **Integration with knowledge layer** — Retrieval used by Test Console and `retrieve` admin API MUST go through `getKnowledgeProvider()` (or documented thin wrapper), not ad hoc Supabase in feature routes — aligns with SEI-50/SEI-51 architecture.
- **FR-007**: **Tests** — Follow TDD per [CLAUDE.md](../../CLAUDE.md): failing tests first for auth gates (401), optional 403 for non-admin, and critical KB/agent behaviors. Coverage targets apply to new admin code.

### Key Entities (if feature involves data)

- **Agent**: Rows in `agents` (prompt, status, tags, etc.) edited via Prompt Control APIs.
- **KnowledgeBaseDocument / KnowledgeBaseChunk**: KB CRUD and import affect documents and chunks used for RAG.
- **SystemEvent**: Visible via System Health / `system-events` API where applicable.

### Non-Functional Requirements

- **NFR-001**: **Security**: Secrets only in environment variables; `ADMIN_EMAILS` is not exposed to the client bundle. Admin APIs must not leak stack traces or internal paths in production responses.
- **NFR-002**: **Auditability**: Destructive actions (delete document, bulk import) should log or use existing `logSystemEvent` patterns where the reference does so.
- **NFR-003**: **Performance**: Admin list views should remain usable with hundreds of documents (pagination or reference behavior).

### Known limitations (this ticket)

- **Concurrent KB/prompt edits**: **Last-write-wins** only. Operators may overwrite each other’s changes without a conflict warning. Stronger merging or locking is **out of scope** for SEI-52 (same transparency approach as SEI-51 concurrent-use notes).

## Success Criteria (mandatory)

### Measurable Outcomes

- **SC-001**: KB CRUD works end-to-end: create, edit, delete documents as the reference UI supports; data visible in DB and Test Console.
- **SC-002**: Prompt Control loads and saves agent system prompt; persisted value is what downstream coach code reads.
- **SC-003**: Test Console runs retrieval against current KB and matches server retrieval semantics.
- **SC-004**: All listed admin API routes return **401** when unauthenticated; when `ADMIN_EMAILS` is non-empty, non-listed signed-in users receive **403**; when `ADMIN_EMAILS` is unset, any authenticated user may use admin (pilot default).
- **SC-006**: Import rejects files **> 10 MB**; import processing that exceeds **30s** returns **408** with a clear message; no chunked streaming on import responses.
- **SC-005**: `npm run lint` and `npm run build` pass; automated tests cover auth boundaries and key admin behaviors per FR-007.
