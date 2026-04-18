---
linear: https://linear.app/sei-interview-app/issue/SEI-50/sei-lc-01-auth-knowledge-provider-abstraction
ticket: SEI-50
---

# Feature Specification: Knowledge provider abstraction (Supabase default, Azure stub)

**Feature Branch**: `SEI-50-auth-knowledge-provider`  
**Created**: 2026-04-18  
**Status**: Draft  
**Linear Ticket**: [SEI-50](https://linear.app/sei-interview-app/issue/SEI-50/sei-lc-01-auth-knowledge-provider-abstraction)  
**Input**: User description: "SEI-50" (ticket ID only; scope inferred from [bootstrap-summary.md](../../bootstrap-summary.md) Technical Decisions and Open Dependencies).

## Resolved decisions (this ticket)

| Topic | Decision |
|-------|----------|
| Azure stub | Every `AzureKnowledgeProvider` method throws with message: `AzureKnowledgeProvider: not yet implemented. Set KNOWLEDGE_PROVIDER=supabase or implement against SEI Azure data source.` |
| Unknown `KNOWLEDGE_PROVIDER` | Fail fast at startup (or factory call) with a clear configuration error. Allowed values: `supabase`, `azure`. When unset, default to `supabase`. |
| Local dev auth | Use placeholder env values (`AZURE_AD_CLIENT_ID=placeholder`, `AZURE_AD_TENANT_ID=placeholder`, plus any other Azure AD vars required for the app to build) so the build passes without a real Entra app registration. Auth flows redirect to a non-functional login experience locally until real values are supplied. |
| Lint | `next lint` only, matching the existing pattern in sei-sales-coach. No custom ESLint rules for forbidden imports in this ticket. |
| Tests | No automated test suite for this ticket. Verification is manual: 401 behavior where applicable, grep checks, and `npm run ensure:build` (or equivalent) passing. |
| Supabase errors | No retry layer in this ticket; surface errors to callers as typed failures. |
| Concurrent use | Providers MUST avoid unsafe mutable shared state; connection handling follows normal Next.js serverless constraints. No extra pooling spec in this ticket. |

## User Scenarios & Testing (mandatory)

### User Story 1 - Resolve knowledge operations through a single interface (Priority: P1)

Developers call a stable TypeScript API under `lib/knowledge/` for retrieval and related knowledge operations used by the Assessment Coach. At runtime the implementation is selected by `KNOWLEDGE_PROVIDER` (`supabase` or `azure`). The app ships with the Supabase-backed provider; Azure is a throwing stub until the SEI Azure data source exists.

**Why this priority**: Without this layer, swapping data sources later forces risky refactors across `app/` and `lib/`. The abstraction is the contract for sei-org readiness.

**Independent Test (manual)**: With `KNOWLEDGE_PROVIDER=supabase`, exercise code paths that use the provider and confirm behavior. With `KNOWLEDGE_PROVIDER=azure`, confirm calls throw the exact stub message above. Confirm call sites outside `lib/knowledge/` do not import `@supabase/supabase-js` for knowledge access.

**Acceptance Scenarios**:

1. **Given** `KNOWLEDGE_PROVIDER` is unset or `supabase`, **When** application code requests knowledge for a supported operation, **Then** the Supabase-backed implementation runs and returns typed results or typed errors.
2. **Given** `KNOWLEDGE_PROVIDER=azure`, **When** application code invokes a knowledge operation, **Then** the Azure provider throws with the stub message; feature code outside `lib/knowledge/` still does not import Supabase client modules for that path.
3. **Given** `KNOWLEDGE_PROVIDER` is set to an unknown value, **When** the factory runs, **Then** configuration fails fast with a clear error (no silent fallback to Supabase).

### User Story 2 - No duplicate data-access patterns in feature routes (Priority: P2)

API routes and React server components that need knowledge data import only from `lib/knowledge/` (or a thin facade re-export), not from `@supabase/supabase-js` or future Azure SDKs directly.

**Why this priority**: Keeps route handlers small and preserves the swap guarantee from bootstrap decisions.

**Independent Test (manual)**: Run `next lint` (project default). Optionally run documented grep commands to confirm no direct Supabase client imports in forbidden paths for code added in this ticket.

**Acceptance Scenarios**:

1. **Given** a new API route under `app/api/`, **When** it needs chunked retrieval or document metadata, **Then** it uses `lib/knowledge/` exports only.
2. **Given** a refactor of the Supabase schema, **When** only the Supabase provider changes, **Then** callers in `app/` require no edits.

### Edge Cases

- Supabase pooler unreachable: errors propagate; no automatic retries in this ticket.
- `KNOWLEDGE_PROVIDER=azure`: stub throws the exact message in the table above on method calls (not necessarily at process startup).
- Concurrent requests: no shared mutable singleton state that is unsafe under concurrent serverless invocations.

## Requirements (mandatory)

### Functional Requirements

- **FR-001**: The system MUST expose a documented public API under `lib/knowledge/` (types + factory or `getKnowledgeProvider()`) that encapsulates all knowledge data access needed by the Assessment Coach for this milestone.
- **FR-002**: Environment variable `KNOWLEDGE_PROVIDER` MUST accept `supabase` or `azure` only. When unset, the default MUST be `supabase`.
- **FR-003**: `AzureKnowledgeProvider` MUST implement the same interface as the Supabase provider; every public method MUST throw with message exactly: `AzureKnowledgeProvider: not yet implemented. Set KNOWLEDGE_PROVIDER=supabase or implement against SEI Azure data source.`
- **FR-004**: This ticket MUST NOT add an automated test suite. Verification MUST be manual per Success Criteria (401 checks where auth applies, grep checks, build and lint).
- **FR-005**: Application code outside `lib/knowledge/` MUST NOT use `STUB_USER_ID` or equivalent fake identity patterns — aligns with bootstrap Authentication row for eventual sei-org PRs.
- **FR-006**: Local development MUST support placeholder Azure AD env vars (`AZURE_AD_CLIENT_ID=placeholder`, `AZURE_AD_TENANT_ID=placeholder`, and any other vars required so `next build` succeeds without a real Entra registration). Document these in README or `docs/`. Until real values exist, sign-in MUST redirect to a non-functional login experience (build-safe, not production-ready).

### Key Entities (if feature involves data)

- **KnowledgeProvider**: Interface for knowledge operations for this milestone; shape follows the first consumer in this repo (minimal surface area, extended when retrieval is fully wired).
- **ProviderConfig**: Env-driven configuration (URLs, keys, `KNOWLEDGE_PROVIDER`); no secrets in source control.

### Non-Functional Requirements

- **NFR-001**: **Security**: Secrets only via environment variables; placeholder values are for local build only and MUST NOT be used in production.
- **NFR-002**: **Lint**: Use `next lint` as the only lint gate for this work, consistent with sei-sales-coach. No new custom ESLint rules required for import boundaries in this ticket.

## Success Criteria (mandatory)

### Measurable Outcomes

- **SC-001**: `npm run lint` (via `next lint`) and `npm run build` pass; using `npm run ensure:build` is acceptable if it remains the project standard.
- **SC-002**: No new `npm test` or Jest/Vitest requirement for this ticket.
- **SC-003**: Manual verification complete: (1) protected routes or API behavior show expected **401** (or documented equivalent) where auth is enforced; (2) documented **grep** checks show no inappropriate Supabase client imports in `app/` for knowledge paths introduced here; (3) with `KNOWLEDGE_PROVIDER=azure`, invoking the provider throws the exact stub message.
- **SC-004**: With placeholder Azure AD env vars, production build completes without a real app registration.
