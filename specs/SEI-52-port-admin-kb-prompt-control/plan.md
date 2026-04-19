# Implementation Plan: Port admin (KB, Prompt Control, System Health, Test Console) (SEI-52)

**Branch**: `SEI-52-port-admin-kb-prompt-control`  
**Spec**: [specs/features/SEI-52-port-admin-kb-prompt-control.md](../features/SEI-52-port-admin-kb-prompt-control.md)  
**Exploration**: Not yet run (no `specs/explorations/` folder)  
**Design**: Not yet run (no `specs/designs/` folder)

**Estimated timeline**: **4–7 business days** for one developer familiar with Next.js — port from `~/Documents/sei-sales-coach`, plus admin allowlist, import limits, and automated tests.

---

## Prerequisites warnings

- **Exploration**: No written exploration for SEI-52. Optional `/explore` if you want risks recorded before coding.
- **Design**: No separate design doc. UX and layout come from the **reference admin**; align styling with this repo’s tokens where pages are shared with Guide.

---

## What we are building (summary)

Internal **operators** get a secure **Admin** area in this app to manage the **knowledge base** (documents and chunks), edit **Prompt Control** (Assessment agent system prompts in the database), view **system health** signals, and run a **test console** for retrieval. Everyone else stays out: anonymous users are blocked, and when `ADMIN_EMAILS` is set, only listed emails can use admin after sign-in (case-insensitive match). If that env var is empty, any signed-in user may use admin so the pilot stays easy to demo.

This ticket does **not** change the learner-facing Assessment flow except through better KB and prompt data.

---

## Technical approach

Deliver in **four** slices (order matters for security):

1. **Admin gate (about 0.5–1 day)** — Add a small **`lib/` helper** (e.g. `isAdminUser(session)`) that parses **`ADMIN_EMAILS`** (comma-separated lowercase in config; compare case-insensitively). Empty list means “allow any authenticated user.” Extend **`middleware`** so `/admin` and `/api/admin/*` require a session; when `ADMIN_EMAILS` is non-empty, reject non-admins with **403** for APIs and redirect or safe empty state for pages. Reuse **`auth()`** inside every admin API route so handlers never trust middleware alone.

2. **API port (about 2–3 days)** — Copy behavior from sei-sales-coach for the eight admin routes listed in the spec. Wire **documents/agents** to **Prisma** where the reference uses it; keep **`getKnowledgeProvider()`** for **`retrieve`** and any test-console server path per **FR-006**. Implement **import** per **FR-004a**: **10 MB** max body, **30 s** processing budget, **408** on timeout, **413** (or equivalent) for oversize, no chunked streaming on the response.

3. **UI port (about 1–2 days)** — Port **`app/admin/page.tsx`**, **`app/admin/test-retrieval/page.tsx`**, and the four **`components/admin/*`** tabs. Strip or replace any dependency on **SPIN-only** or **assessment-builder** code paths; if a tab truly needs a shared util, copy the minimum into this repo.

4. **Tests and hardening (about 1 day)** — **TDD** where practical: tests first for **401** without session, **403** when `ADMIN_EMAILS` is set and user is not listed, import size and timeout behavior (unit or integration). Run **`npm run lint`**, **`npm run build`**, manual smoke: KB CRUD, prompt save, test retrieval, system events list.

**Parallelism**: After the admin helper exists, **API routes** and **UI** can progress in parallel on separate branches if merges are coordinated.

---

## Constitution check

- **SDD / Linear**: Spec exists with ticket [SEI-52](https://linear.app/sei-interview-app/issue/SEI-52); branch name matches spec.
- **Directory contract**: Pages in `app/admin/`, APIs in `app/api/admin/`, shared logic in `lib/`, UI in `components/admin/`.
- **Tech stack**: Next.js 14 App Router, TypeScript, NextAuth, Prisma, Vitest (as adopted).
- **Assessment integrity**: Prompt Control remains the **single source of truth** for agent prompts in the database; no duplicate “secret” prompts in client-only code.
- **TDD**: New admin code should follow red-green-refactor; coverage targets per [CLAUDE.md](../../CLAUDE.md).

### Exceptions

- **None** versus the written spec. **Concurrent edits** stay **last-write-wins** by design (documented known limitation).

### Agents (database)

If a migration or seed **inserts new `agents` rows**, document whether **`agent_type`** is set (e.g. `Guide`) or left null for Prompt Control assignment before activation — per [CLAUDE.md](../../CLAUDE.md) Gotchas (“Adding new agents”). SEI-52 is primarily **edit via admin**, not necessarily new inserts; note in the implementation log if seeds are added.

---

## Files that will be created or modified

### User-facing

- **`app/admin/page.tsx`**: Admin home with tabs (Knowledge Base, Prompt Control, System Health, Test Console as in reference).
- **`app/admin/test-retrieval/page.tsx`**: Focused test retrieval UI if the reference keeps it separate.

### Behind the scenes

- **`components/admin/KnowledgeBaseTab.tsx`**, **`PromptControlTab.tsx`**, **`SystemHealthTab.tsx`**, **`TestConsoleTab.tsx`**: Tab UIs calling admin APIs.
- **`app/api/admin/agents/route.ts`**, **`app/api/admin/agents/[id]/route.ts`**: List/create/update agents for Prompt Control.
- **`app/api/admin/documents/route.ts`**, **`app/api/admin/documents/[id]/route.ts`**, **`app/api/admin/documents/import/route.ts`**: KB CRUD and import with size and timeout rules.
- **`app/api/admin/retrieve/route.ts`**: Server retrieval for debugging; must use **`getKnowledgeProvider()`** semantics.
- **`app/api/admin/agent-config/route.ts`**, **`app/api/admin/system-events/route.ts`**: Config and events surfaces per reference.
- **`middleware.ts`**: Protect `/admin` and `/api/admin/*`; session required; optional email allowlist.
- **`lib/` helper**: e.g. `lib/adminAuth.ts` or extend **`lib/requireAuth.ts`** with `requireAdmin()` returning 401 vs 403 per spec.

### Tests

- **`__tests__/`** (or colocated): Admin allowlist parsing, 401/403 behavior, import size guard, timeout handling (mocked clock or short timeout in test env).

### Configuration

- **`.env.example`**: Already documents **`ADMIN_EMAILS`**; keep in sync if behavior changes.

---

## Dependencies

**Must be done first**

- **SEI-50 / SEI-51 foundation**: Auth (`auth()`), Prisma schema for `agents` and knowledge tables, **`getKnowledgeProvider()`** — admin builds on these. If SEI-51 is not merged, align branches before shipping SEI-52.

**Can build in parallel**

- API route port vs. UI port (after shared types and admin helper exist).

**Unlocks later work**

- Richer RBAC (groups, Entra roles) instead of a flat email list — out of scope for this ticket.

---

## Test strategy

| Area | What we verify |
|------|----------------|
| **Happy path** | Listed admin email (or any user when env empty) can CRUD documents, save prompts, run test retrieval, view system events. |
| **401** | No session cookie → admin APIs return **401**. |
| **403** | `ADMIN_EMAILS` set, user not in list → **403** on APIs; pages do not leak data. |
| **Import** | File **> 10 MB** rejected; simulated long import returns **408** after **30 s** with clear message. |
| **Retrieval** | Admin retrieve matches **`getKnowledgeProvider().search()`** (or documented wrapper) vs direct Supabase in routes. |

**How we know it works**: Automated tests for gates plus manual walkthrough of the four tabs against a staging database with real-ish KB content.

---

## Risks and mitigations

| Risk | Business impact | Mitigation |
|------|-----------------|------------|
| Reference imports SPIN or assessment-builder | Build breaks or wrong product surface | Grep and remove; copy minimal utilities only. |
| Wrong person gets admin when `ADMIN_EMAILS` empty | Pilot leak of edit rights | Document in README; set `ADMIN_EMAILS` before production. |
| Import times out on large PDFs | Operator confusion | Clear **408** message; document 10 MB and 30 s in operator notes. |
| Two operators overwrite each other | Lost edits | Accept for pilot; known limitation in spec. |

---

## Implementation phases

**Phase 1: Gate and middleware** (Day 1)

- Admin helper, middleware updates, `requireAdmin`-style API guard.
- **Deliverable**: Unauthenticated → 401; wrong email → 403 when env set (proven by tests).

**Phase 2: APIs** (Days 2–4)

- Port eight routes; import limits and timeout; Prisma + knowledge provider wiring.
- **Deliverable**: Postman or tests prove CRUD, import boundaries, retrieve behavior.

**Phase 3: UI** (Days 4–5)

- Port pages and tabs; fix imports and styling.
- **Deliverable**: Internal demo of full admin surface.

**Phase 4: QA and review** (Days 6–7)

- Full spec success criteria, lint, build, implementation log if the team uses one.
- **Deliverable**: Ready for merge per SDD.

---

## Deployment plan

**Feature flag**: **No** for internal MVP unless product asks — admin is already restricted by auth and optional email list.

**Database changes**: **Likely none** if SEI-51 Prisma schema already includes `agents`, `knowledge_base_documents`, `knowledge_base_chunks`, `system_events`. If the reference expects extra columns or indexes, add a **migration** and document.

**Rollback**: Revert deployment; data edits made through admin remain in DB — operators should treat destructive actions carefully (audit logging per NFR-002 where possible).

---

## Success metrics

- **Operator task time**: KB update or prompt change completes without database access.
- **Security**: No anonymous admin access; optional email allowlist works in staging.
- **Stability**: Lint and build green; tests cover auth and import boundaries.

---

## Timeline breakdown

| Phase | Duration | Why |
|-------|----------|-----|
| Phase 1 | ~1 day | Security foundation before large port |
| Phase 2 | ~2–3 days | Eight API surfaces + import rules |
| Phase 3 | ~1–2 days | Four tabs + two pages |
| Phase 4 | ~1 day | Tests, manual QA, docs |

**Total**: **4–7 days**  
**Confidence**: **Medium** — depends on how tangled reference imports are and whether Prisma schema matches reference queries without extra migrations.

---

## What could make this take longer

- **Hidden dependencies** on assessment-builder or SPIN in admin tabs → **+1–2 days** to untangle or stub.
- **Schema drift** vs sei-sales-coach → **+0.5–1 day** for migrations and query fixes.
- **Entra email claim** differs from expected shape → **+0.5 day** to normalize email in session.

---

## What's NOT included

- Optimistic locking or merge UI for concurrent edits.
- Chunked streaming responses for import.
- Full role-based access beyond the **`ADMIN_EMAILS`** list (e.g. Entra app roles) — future enhancement.
- Porting non-admin surfaces (`coach/`, full assessment-builder) unless explicitly pulled in by a tab and approved.

---

## Next steps

1. Review this plan with the [spec](../features/SEI-52-port-admin-kb-prompt-control.md).
2. Optional: run `/explore` for a written risk log.
3. Create branch `SEI-52-port-admin-kb-prompt-control`.
4. Run `/implement SEI-52` when ready; keep an implementation log if the team uses one (see SEI-51 folder pattern).
