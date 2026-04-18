# Implementation log: SEI-50 (auth and knowledge provider abstraction)

**Date**: 2026-04-18  
**Spec**: [../features/SEI-50-auth-knowledge-provider.md](../features/SEI-50-auth-knowledge-provider.md)  
**Plan**: [plan.md](./plan.md)

## Decisions

- **TDD exception**: Per spec FR-004, this ticket uses **manual verification only** (lint, build, 401, grep, stub message). No Jest/Vitest suite added. Follow-up work can add tests.
- **Auth config split**: `auth.config.ts` + `auth.ts` to align with Auth.js Edge guidance and remove middleware bundle warnings.
- **Middleware**: `/guide/*` and `/api/guide/*` protected. APIs return **401** JSON when unauthenticated; pages redirect to `/signin`.
- **Knowledge API**: `GET /api/guide/knowledge/health` returns provider kind and health; uses `getKnowledgeProvider()` only (no Supabase import in `app/`).

## Files added or changed

| Area | Files |
|------|--------|
| Knowledge | `lib/knowledge/constants.ts`, `types.ts`, `azure-provider.ts`, `supabase-provider.ts`, `factory.ts`, `index.ts` |
| Auth | `auth.config.ts`, `auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `middleware.ts`, `app/providers.tsx`, `app/signin/page.tsx` |
| App | `app/guide/page.tsx`, `app/api/guide/knowledge/health/route.ts`, `app/page.tsx`, `app/layout.tsx` |
| Config / docs | `.env.example`, `README.md` |

## Verification performed

- `npm run ensure:build` (exit 0).
- `curl` to `/api/guide/knowledge/health` without a session returned **401**.
- Manual steps documented in README (401 curl, grep, Azure stub with `KNOWLEDGE_PROVIDER=azure`).

## Follow-up commit

- **AUTH_SECRET**: Dev server required a secret for `/api/auth/session`. Added a non-production fallback when `NODE_ENV` is not `production` so `npm run dev` works without `.env.local`; production must still set `AUTH_SECRET`.

## Spec clarifications discovered

- NextAuth v5 uses provider id `azure-ad` for `signIn("azure-ad")`.
- Health route returns 500 JSON with stub message body when `KNOWLEDGE_PROVIDER=azure` (handler catches thrown error). Alternative would be rethrow 501; current behavior matches manual inspection of error text.
