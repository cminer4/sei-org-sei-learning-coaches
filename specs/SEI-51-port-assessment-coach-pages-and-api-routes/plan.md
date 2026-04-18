# Implementation Plan: Port Assessment Coach pages and API routes (SEI-51)

**Branch**: `SEI-51-port-assessment-coach-pages-and-api-routes`  
**Spec**: [specs/features/SEI-51-port-assessment-coach-pages-and-api-routes.md](../features/SEI-51-port-assessment-coach-pages-and-api-routes.md)  
**Exploration**: Not yet run (no `specs/explorations/` folder)  
**Design**: Not yet run (no `specs/designs/` folder)

**Estimated timeline**: **5-8 business days** for one developer comfortable with Next.js and the reference repo — large surface area (pages, five API areas, Prisma, lib port), plus TDD and manual E2E.

---

## Prerequisites warnings

- **Exploration**: No written exploration for SEI-51. Consider `/explore` if you want a recorded risk pass before deep porting.
- **Design**: No separate design doc. UX comes from **sei-sales-coach**; align tokens with this repo’s Guide styling as you integrate.

---

## What we're building (summary)

We are **moving the Assessment Coach experience** from the reference app (`~/Documents/sei-sales-coach`) into **this** repo: the onboarding screen, voice and text practice session, learning summary, and the server endpoints they rely on (LLM, ElevenLabs, session storage, summary generation). Consultants get a **single product path** under `/guide/assessment` with **real sign-in** (no fake user IDs) and **knowledge access** through the existing `getKnowledgeProvider()` layer.

The **Custom LLM** URL that ElevenLabs calls is secured with a **shared secret** (Bearer token), not the user’s login — that is intentional so the voice vendor can reach your server without holding Microsoft sessions.

---

## Technical approach

We will deliver this in **five** slices (order matters where noted):

1. **Database foundation (about 1 day)** — Add Prisma with **only** the tables in the spec (`agents`, knowledge docs and chunks, `sessions`, `system_events`). Create the first migration with **`prisma migrate dev`** (never `db push` for this feature). Wire `lib/prisma.ts` from the reference and ensure the client matches the schema. **When seeding or migrating agent rows**, document whether `agent_type` is set in SQL (e.g. `Guide`) or left null for Prompt Control — per [CLAUDE.md](../../CLAUDE.md) agent gotchas, pick one approach and record it in the migration or README.

2. **Lib layer port (about 1-2 days)** — Copy the listed **direct** files into `lib/` and fix imports. **Strip SPIN** from `coaching.ts` so only the Assessment path remains. **Rewire** `retrieval.ts` to use `getKnowledgeProvider().search()` (and related methods) instead of calling Supabase directly. Run tests as you go (TDD for non-trivial branches).

3. **API routes (about 1-2 days)** — Port each route under `app/api/` to mirror the reference path segments. **Four routes** use `auth()` before any business logic. **`voice-llm/chat/completions`** validates `Authorization: Bearer` against `INTERVIEW_COACH_CUSTOM_LLM_API_KEY` (constant-time compare), **not** `auth()`. Return **401** when credentials are wrong. Document new env vars in `.env.example`.

4. **UI and root redirect (about 1-2 days)** — Add `app/guide/assessment/*` pages and port **`AssessmentVoiceCoach.tsx`**. Replace the current home page behavior with a **redirect** from `/` to `/guide/assessment` (per spec). Do **not** import `coach/`, `assessment-builder/`, `geopoliticalBrief/`, or SPIN **`VoiceCoach.tsx`**.

5. **Verification (about 1 day)** — `npm run lint`, `npm run build`, automated tests for auth guards, Bearer guard, and critical lib behavior; manual E2E: sign in → onboarding → session (voice and/or text) → summary; confirm confidence strings and session consistency per [CLAUDE.md](../../CLAUDE.md).

**Parallelism**: After Prisma + `lib/prisma` exist, **API routes** and **pages** can often proceed in parallel on two branches if you merge carefully; **retrieval/coaching** should be stable before heavy API wiring.

---

## Constitution check

- **SDD / Linear**: Spec exists with [SEI-51](https://linear.app/sei-interview-app/issue/SEI-51); branch name matches spec.
- **Directory contract**: Pages in `app/`, APIs in `app/api/`, shared logic in `lib/`, UI in `components/`.
- **Assessment integrity**: Learning summaries stay teaching-focused; confidence only `Building` | `Developing` | `Strong`; voice and text paths stay consistent — verify in summary API and UI.
- **TDD**: [CLAUDE.md](../../CLAUDE.md) requires tests for new features. **This repo has no `test` script yet** — add **Jest** or **Vitest** (Vitest pairs well with Next 14) in Phase 1 or early Phase 2, then keep **red-green-refactor** for auth helpers, Bearer validation, and coaching/retrieval changes.
- **No stub users**: Grep for `STUB_USER_ID` and remove any reference patterns from ported code.

### Exceptions

- **None** versus the spec. If timeline slips, cut scope only with an explicit spec amendment (not silently).

---

## Files that will be created or modified

### User-facing

- **`app/page.tsx`**: Redirect visitors to `/guide/assessment` (replaces current marketing-style home with links).
- **`app/guide/assessment/page.tsx`**: Onboarding.
- **`app/guide/assessment/session/page.tsx`**: Practice session (voice + text as ported).
- **`app/guide/assessment/summary/page.tsx`**: Learning summary.
- **`components/AssessmentVoiceCoach.tsx`**: Voice UI (from reference, adjusted imports).

### Behind the scenes — APIs

- **`app/api/voice-llm/chat/completions`** (or reference path): Custom LLM; **Bearer** = `INTERVIEW_COACH_CUSTOM_LLM_API_KEY`.
- **`app/api/elevenlabs-signed-url`**, **`elevenlabs-conversation-transcript`**, **`onboarding/session`**, **`assessment-summary`**: **`auth()`** on each.

### Behind the scenes — lib

- **Direct port**: `embeddings.ts`, `logSystemEvent.ts`, `prompts.ts`, `scoringPrompts.ts`, `voiceSessionStore.ts`, `agents.ts`, `agentConfig.ts`, `prisma.ts` (paths per reference; align with existing `lib/knowledge/`).
- **Modified**: `coaching.ts` (Assessment only), `retrieval.ts` (provider-based search).

### Database

- **`prisma/schema.prisma`**: Scoped models only; migrations under `prisma/migrations/`.

### Tests and config

- **`package.json`**: Add `test` script and test runner if missing.
- **`__tests__/` or colocated `*.test.ts`**: Auth/Bearer helpers, route handlers (where practical), retrieval/coaching unit tests.

### Documentation

- **`.env.example`**: `INTERVIEW_COACH_CUSTOM_LLM_API_KEY`, any ElevenLabs, LLM, and DB vars required by ported routes.

---

## Dependencies

**Must be done first**

- **SEI-50 foundation** (auth + knowledge provider) is already in this repo — `auth()`, `getKnowledgeProvider()`, middleware patterns. SEI-51 **builds on** that; do not reintroduce direct Supabase in app routes for knowledge.

**Can build in parallel**

- Prisma schema + migration vs. copying read-only lib files that do not yet hit DB (still coordinate before merging).

**Blocks future work**

- Full Assessment RAG content ops, Prompt Control workflows, and Azure production deploy all assume this port is merged and stable.

---

## Test strategy

**What we'll test**

| Area | Approach |
|------|----------|
| **Happy path** | Automated or manual: signed-in user completes onboarding → session → summary; summary shows allowed confidence values. |
| **User-session APIs** | Request without session → **401** (or documented equivalent). |
| **Custom LLM** | Request without correct Bearer → **401**; with correct key → handler runs (mock downstream if needed). |
| **Retrieval** | Unit tests: `retrieval` uses provider mock, not Supabase client. |
| **Exclusions** | Grep: no imports from excluded folders or SPIN `VoiceCoach.tsx`. |

**How we'll know it works**: Spec success criteria SC-001 through SC-005 pass; lint and build green; critical paths covered by tests per FR-008.

---

## Risks and mitigations

| Risk | Business impact | Mitigation |
|------|-----------------|------------|
| Reference imports a hidden dependency on excluded modules | Build breaks or SPIN code leaks | Port in small PRs; grep imports after each file; copy minimal utilities only. |
| Env drift between repos | Voice or summary fails in staging | Single `.env.example` checklist; document ElevenLabs and LLM URLs. |
| Prisma schema drift from reference | Migration conflicts | Stay within spec’s five table groups; document any intentional omission. |
| Test setup overhead | Slower first week | Add Vitest/Jest once, reuse for later tickets. |

---

## Implementation phases

**Phase 1: Data and lib core** (Days 1-2)

- Prisma schema + `migrate dev`; `lib/prisma.ts` and copied libs; `coaching.ts` / `retrieval.ts` edits; introduce test runner and first unit tests.

- **Deliverable**: DB applies cleanly; knowledge path uses provider in code.

**Phase 2: APIs** (Days 3-4)

- Port five API areas with correct auth model (Bearer vs `auth()`); env docs.

- **Deliverable**: Postman or automated calls prove 401 vs success paths.

**Phase 3: Pages and voice UI** (Days 4-6)

- Assessment pages, `AssessmentVoiceCoach`, root redirect; manual E2E.

- **Deliverable**: Demo-quality flow for internal review.

**Phase 4: Hardening** (Days 6-8)

- Coverage for critical logic; fix lint; full spec checklist; implementation log if the team uses one.

- **Deliverable**: Ready to merge per SDD review.

---

## Deployment plan

**Feature flag**: Not required for internal MVP unless product asks — default **No**.

**Database changes**: **Yes** — new tables via migrations. Apply in staging before production; use the same migration files the spec requires.

**Agent rows**: If migrations or seeds insert into `agents`, record the **agent_type** decision (set vs null for Prompt Control) in the migration comment or README.

**Rollback**: Revert the deployment; migrations may need a down migration or restore from backup if production data was written — plan maintenance window if production DB is live.

---

## Success metrics

- **Flow completion rate (internal QA)**: Team can finish onboarding → summary without errors in voice and text.
- **Security checks**: No session on user APIs; wrong Bearer on Custom LLM fails closed.
- **Code health**: Lint/build green; tests cover guards and retrieval; no excluded imports.

---

## Timeline breakdown

| Phase | Duration | Why |
|-------|----------|-----|
| Phase 1 | 1-2 days | Prisma + lib port + test harness |
| Phase 2 | 1-2 days | Five API surfaces and auth split |
| Phase 3 | 1-2 days | Pages, component, redirect, E2E |
| Phase 4 | 1-2 days | Tests, docs, polish |

**Total**: **5-8 days**  
**Confidence**: **Medium** — depends on how tangled the reference imports are and whether ElevenLabs env is available in dev.

---

## What could make this take longer

- **Reference coupling**: Hidden imports from excluded modules could add **1-3 days** of untangling.
- **Prisma / data model mismatch**: If reference uses extra columns or tables, reconciling with the spec’s scope could add **1-2 days**.
- **No dev ElevenLabs / LLM keys**: Voice E2E blocked until keys exist — plan manual testing with mocks or staging.

---

## What's NOT included

- SPIN coach, geopolitical brief, assessment-builder, or non-Assessment `VoiceCoach`.
- Public webhooks or unauthenticated user callbacks (explicitly out of architecture).
- `prisma db push` as a delivery mechanism for this feature.

---

## Next steps

1. Review this plan and the spec together.
2. Optional: run `/explore` if you want a written risk log before coding.
3. Create branch `SEI-51-port-assessment-coach-pages-and-api-routes`.
4. Run `/implement SEI-51` or start Phase 1 when ready; keep an implementation log if the team uses one (see SEI-50 folder pattern).
