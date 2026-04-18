# Implementation Plan: Auth and knowledge provider abstraction (SEI-50)

**Branch**: `SEI-50-auth-knowledge-provider`  
**Spec**: [specs/features/SEI-50-auth-knowledge-provider.md](../features/SEI-50-auth-knowledge-provider.md)  
**Exploration**: Not yet run  
**Design**: Not yet run (auth uses a minimal placeholder sign-in experience per spec, not a full marketing-quality screen)

**Estimated timeline**: 2-4 business days for a single developer familiar with Next.js — mostly wiring and configuration, not heavy UI.

---

## Prerequisites warnings

- **Exploration**: No `specs/explorations/*SEI-50*` file exists. Consider running `/explore` if you want a written risk pass before coding.
- **Design**: No design doc. Acceptable for this ticket because the spec explicitly calls for a **non-functional, build-safe** local login until real Entra values exist.

---

## What we are building (summary)

Internal consultants will eventually sign in with **SEI Microsoft accounts** (Entra ID), and all app routes that matter will require a real session. In parallel, **knowledge data** (documents, retrieval) will flow through one **swap-friendly** module so we can start on Supabase today and plug in Azure later without rewriting screens.

This ticket **lays the foundation**: NextAuth v5 + Azure AD wiring with **placeholder** environment values so builds and local runs work before Antonio and Katie finish app registration; a **`lib/knowledge/`** factory with a real Supabase path (default) and an **Azure stub** that fails with an exact message until the data source exists; **middleware** so unauthenticated users get **401** or redirects as documented; **no automated tests** per spec — verification is manual (lint, build, grep, auth checks).

---

## Technical approach

We will deliver this in **three** slices:

1. **Knowledge module (about 1 day)** — Define a small `KnowledgeProvider` interface and a `getKnowledgeProvider()` (or equivalent) that reads `KNOWLEDGE_PROVIDER`. Default is `supabase`. Unknown values throw a clear error. `AzureKnowledgeProvider` implements the interface but **every method** throws the spec’s exact string. `SupabaseKnowledgeProvider` uses the Supabase client only inside `lib/knowledge/` so routes never import the client directly for knowledge. Minimal methods on the interface for this milestone (for example a health or ping operation, or the first retrieval shape you need when porting Assessment). If nothing calls retrieval yet, expose the factory plus a trivial method so the abstraction is real and testable manually.

2. **Auth shell (about 1-2 days)** — Add NextAuth v5 with the **Azure AD** provider. Document `AZURE_AD_CLIENT_ID`, `AZURE_AD_TENANT_ID`, and any **NextAuth / Auth.js** variables the stack requires (`AUTH_SECRET`, `AUTH_URL`, provider-specific IDs — align names with `next-auth` v5 and Azure AD provider docs). Use **placeholder** values for local dev so `next build` succeeds. Add **middleware** that protects `/guide/**` (and optionally all non-public routes): unauthenticated requests to protected APIs return **401** (or redirect to sign-in for pages — spec allows “401 or documented equivalent”; document the choice in README). Add a **stub** sign-in page or flow that is intentionally non-production (clear messaging for developers). **No `STUB_USER_ID`** anywhere.

3. **Documentation and manual QA (about half a day)** — `.env.example` (or `docs/env.md`), README section for placeholders and grep commands, run `npm run ensure:build`, execute the manual checklist from the spec (401, grep, Azure stub message, build with placeholders).

This order lets you validate the knowledge factory early, then layer auth without blocking builds.

---

## Constitution check

- **SDD / Linear**: Spec exists with ticket [SEI-50](https://linear.app/sei-interview-app/issue/SEI-50/sei-lc-01-auth-knowledge-provider-abstraction); branch name matches.
- **Directory contract**: `lib/knowledge/*`, `app/api/**`, `middleware.ts`, auth config at project root or `lib/auth` per NextAuth App Router conventions.
- **Tech stack**: Next.js 14 App Router, TypeScript, NextAuth v5, Supabase client only inside `lib/knowledge` for knowledge paths.
- **Lint**: `next lint` only — no new ESLint rules for import boundaries this ticket.

### Exception (TDD vs this spec)

- **CLAUDE.md** defaults to TDD for new features.
- **Approved spec** for SEI-50 explicitly says **no automated test suite**; verification is **manual** (401, grep, build).
- **Plan**: Implement and verify per **spec FR-004 and Success Criteria**; record this exception in the implementation log. Follow-up tickets can add Jest/Vitest and backfill tests when the team lifts the “manual only” constraint.

---

## Files that will be created or modified

### User-facing

- **Sign-in / auth entry**: Minimal page or button flow for “Sign in with Microsoft” that works only after real Entra configuration; with placeholders, users see a **non-functional** or clearly broken path — acceptable per spec.
- **Protected areas**: `/guide/**` (and any other agreed routes) require a session via middleware.

### Behind the scenes

- **`lib/knowledge/types.ts`**: `KnowledgeProvider` interface and shared types.
- **`lib/knowledge/supabase-provider.ts`**: Supabase-backed implementation (env: Supabase URL, keys — document in `.env.example`).
- **`lib/knowledge/azure-provider.ts`**: Stub; all methods throw the exact spec message.
- **`lib/knowledge/index.ts`** (or `factory.ts`): Parse `KNOWLEDGE_PROVIDER`, validate, export `getKnowledgeProvider()`.
- **`auth.ts`** (or `lib/auth.ts`): NextAuth configuration with Azure AD provider.
- **`app/api/auth/[...nextauth]/route.ts`**: Auth.js route handler for App Router.
- **`middleware.ts`**: Protect routes; align session cookie / matcher with NextAuth v5.
- **Optional**: `app/api/**/route.ts` — a small internal route that uses `getKnowledgeProvider()` to prove wiring (or the first real consumer from Assessment port).

### Configuration and docs

- **`.env.example`**: `KNOWLEDGE_PROVIDER`, Supabase vars, Azure AD placeholders, `AUTH_*` vars as required.
- **`README.md`** or **`docs/`**: Placeholder instructions, manual verification steps (grep patterns, 401 expectations).

### Tests

- **None** for this ticket (per spec). Manual checklist only.

---

## Dependencies

**Must be done first**

- None external — this is a foundation ticket.

**Can build in parallel**

- Assessment route port from sei-sales-coach can start after or in parallel if branches merge carefully; knowledge interface should be stable before wide use.

**Unlocks later work**

- Real Entra app registration (Antonio / Katie).
- `KNOWLEDGE_PROVIDER=azure` with real `AzureKnowledgeProvider` implementation.
- sei-org PR requirements (no stub user IDs, real auth).

---

## Test strategy (manual — per spec)

| Area | What to verify |
|------|------------------|
| **Happy path (auth)** | With real env (staging), sign in with Microsoft and reach a protected page. |
| **Happy path (knowledge)** | With `KNOWLEDGE_PROVIDER=supabase` and valid Supabase env, factory returns Supabase provider; a call that hits the DB or health path behaves as documented. |
| **Error / stub** | With `KNOWLEDGE_PROVIDER=azure`, calling any provider method throws the **exact** stub message. |
| **Config error** | Invalid `KNOWLEDGE_PROVIDER` throws a clear error (no silent default to wrong provider). |
| **401** | Unauthenticated request to a protected API returns 401 (or documented redirect for browser navigation). |
| **Grep** | No `@supabase/supabase-js` imports in `app/` for knowledge (only `lib/knowledge/`). |
| **Build** | `npm run ensure:build` with placeholder Azure AD vars. |

**How we know it works**: Checklist above is signed off; `next lint` clean; production build passes.

---

## Risks and mitigations

| Risk | Business impact | Mitigation |
|------|-----------------|------------|
| NextAuth v5 + Azure AD env naming drifts from docs | Build breaks or login never works | Lock variable names in `.env.example` and README; test `next build` in CI. |
| Middleware too broad | Legitimate traffic blocked | Start with `/guide/**` matcher; document public routes (`/api/auth/*`, static assets). |
| Placeholder Entra values behave differently across NextAuth versions | Confusing local errors | Document “expected failure modes” for placeholder mode. |
| Supabase not configured locally | Knowledge path errors | Document that Supabase env is required for real `supabase` behavior; errors propagate without fake data. |

---

## Implementation phases

### Phase 1: Knowledge provider module

- Add interface, Supabase provider, Azure stub, factory with env validation and defaults.
- **Deliverable**: Import `getKnowledgeProvider()` from one place; manual check of `supabase` vs `azure` behavior.

### Phase 2: Auth and route protection

- NextAuth with Azure AD; placeholders; middleware; stub sign-in UX; ensure no `STUB_USER_ID`.
- **Deliverable**: Unauthenticated users blocked from protected areas; 401 or redirect documented.

### Phase 3: Documentation and sign-off

- `.env.example`, README, manual checklist; `npm run ensure:build`.
- **Deliverable**: Ready for review and merge; implementation log updated.

---

## Deployment plan

**Feature flag**: Not required — foundation code; behavior is controlled by environment variables.

**Database changes**: None for this ticket unless Supabase schema is introduced elsewhere (not required for stub).

**Rollback**: Revert the branch; remove middleware matcher if needed. No production data migration.

---

## Success metrics

- Build and lint pass in CI and locally with documented placeholders.
- Team can grep the repo and confirm knowledge access goes through `lib/knowledge/`.
- Linear SEI-50 acceptance criteria from the spec are copy-pasteable into the implementation log as a QA checklist.

---

## Timeline breakdown

| Phase | Duration | Why |
|-------|----------|-----|
| Phase 1 | ~1 day | Straightforward module; minimal interface |
| Phase 2 | ~1-2 days | Auth integration and middleware are the highest-variance work |
| Phase 3 | ~0.5 day | Docs and manual QA |

**Total**: ~2-4 business days  
**Confidence**: Medium — Azure AD placeholder behavior can surprise; buffer half a day if Entra docs and NextAuth samples diverge.

---

## What could make this take longer

- **Real Entra registration** delayed mid-sprint: does not block merge if placeholders still build; staging verification waits.
- **NextAuth v5 beta API changes**: add time to align route handlers and edge vs node runtime.

---

## What is not included

- Full Assessment Coach UI port from sei-sales-coach (separate work).
- Real Azure-backed knowledge implementation (`AzureKnowledgeProvider` beyond stub).
- Automated unit or E2E tests (explicitly out of scope for this ticket).
- Custom ESLint import rules.
- Production Entra secrets or Azure App Service deployment (tracked in bootstrap Open Dependencies).

---

## Next steps

1. Review this plan and the spec together.
2. Run `/implement SEI-50` when ready (implementation will follow this plan and the spec’s manual verification).
3. Create git branch `SEI-50-auth-knowledge-provider` before Phase 1.

---

## Implementation log

Progress during `/implement` should be appended to [implementation-log.md](./implementation-log.md) (create on first implementation session).
