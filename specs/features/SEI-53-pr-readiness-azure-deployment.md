---
linear: https://linear.app/sei-interview-app/issue/SEI-53
ticket: SEI-53
---

# Feature Specification: PR readiness and Azure deployment documentation

**Feature Branch**: `SEI-53-pr-readiness-azure-deployment`  
**Created**: 2026-04-19  
**Status**: Draft  
**Linear Ticket**: [SEI-53](https://linear.app/sei-interview-app/issue/SEI-53)  
**Input**: User description: "SEI-53: PR readiness + Azure deployment config. Goal: Make the repo PR-ready for sei-org. Create .env.example with all variables documented, update README with Azure deployment section explaining the KNOWLEDGE_PROVIDER swap, document the ElevenLabs Custom LLM URL pattern for the Azure domain, run the full PR readiness checklist (build, lint, greps, 401 checks), and prepare the final commit message. Note open dependencies: Azure AD app registration, Azure data source, ElevenLabs Assessment Agent ID."

## User Scenarios & Testing (mandatory)

### User Story 1 - Contributor can configure deployment without guesswork (Priority: P1)

A developer or DevOps person opens the repo before opening a PR to sei-org. They find **every** environment variable explained in `.env.example`, understand how the **knowledge layer** switches between Supabase (today) and Azure (future), and know **exactly** which values still depend on external teams (Entra app, Azure data, ElevenLabs).

**Why this priority**: Wrong or missing env documentation causes failed deploys and blocks review; this is the gate for a credible PR.

**Independent Test**: A new engineer can copy `.env.example` to `.env.local`, fill only documented placeholders, and match the README “Azure deployment” section to their hosting URL without asking for tribal knowledge.

**Acceptance Scenarios**:

1. **Given** `.env.example`, **when** a contributor reads comments and section headers, **then** each variable has a short purpose (what it does, when it is required, and which product area it serves).
2. **Given** README, **when** they read the Azure deployment section, **then** they see `KNOWLEDGE_PROVIDER=supabase` vs `azure`, what happens today, and that `AzureKnowledgeProvider` is a single swap point.
3. **Given** README, **when** they configure ElevenLabs Custom LLM for a deployed app domain, **then** they see the full URL pattern for the Custom LLM endpoint (HTTPS origin + `/api/voice-llm/chat/completions`) and that auth uses **Bearer `INTERVIEW_COACH_CUSTOM_LLM_API_KEY`**, not the user session.

### User Story 2 - PR passes automated and manual readiness gates (Priority: P1)

Before merge, the project runs the **full PR readiness checklist**: production build, lint, project-specific greps (e.g. no forbidden imports in `app/` for knowledge), and **401** checks on protected routes (session and Custom LLM Bearer as applicable). Results are recorded so reviewers trust the branch.

**Why this priority**: sei-org needs confidence that the branch does not regress security or architecture rules from CLAUDE.md and prior specs (e.g. SEI-50, SEI-51).

**Independent Test**: Running the documented checklist (or `npm run ensure:build` plus listed commands) completes with expected exit codes; failures are actionable.

**Acceptance Scenarios**:

1. **Given** a clean checkout, **when** the contributor runs the checklist, **then** `npm run ensure:build` (or equivalent documented script) passes.
2. **Given** the dev server is running with a typical local env, **when** curl hits unauthenticated protected API routes, **then** documented routes return **401** as specified (no session cookie / no Bearer).
3. **Given** the repo, **when** grep checks run for the knowledge-layer boundary, **then** they match the success criteria in the spec (e.g. no direct Supabase knowledge imports under `app/`).

### User Story 3 - Clear handoff for external dependencies (Priority: P2)

The README or spec points **open dependencies** to a single source of truth: the **Open Dependencies** table in [bootstrap-summary.md](../../bootstrap-summary.md) (owners and status). The PR description does **not** duplicate that table; it references it.

**Why this priority**: Stakeholders need to align ownership; avoids “it works in dev” surprises in production.

**Independent Test**: A PM can open `bootstrap-summary.md` and read the Open Dependencies table without conflicting owners listed elsewhere.

**Acceptance Scenarios**:

1. **Given** the PR or README, **when** someone looks for dependency owners, **then** they are directed to `bootstrap-summary.md` Open Dependencies (not a duplicate list in the spec).

### Edge Cases

- **Partial env**: Some keys are optional in local dev but required in production; `.env.example` MUST distinguish “required for production” vs “optional for local”.
- **AUTH_URL (canonical site URL for Auth.js)**: **Resolved.** Local dev uses `http://localhost:3000`. Production on Azure App Service uses the full public HTTPS origin, e.g. `https://sei-learning-coaches.azurewebsites.net`. This value must match the deployed origin (Auth.js v5 uses `AUTH_URL` in this repo; older NextAuth docs sometimes call the same concept `NEXTAUTH_URL`). The Entra app registration must include the correct redirect URI for the deployed URL — **PR description action item for Antonio** (see Resolved decisions below).
- **Custom LLM URL**: ElevenLabs must call **HTTPS** only; document that the path is fixed under this repo (`/api/voice-llm/chat/completions`).
- **No secrets in repo**: `.env.example` contains placeholders only; never real keys.

## Resolved decisions (formerly NEEDS CLARIFICATION)

| Topic | Resolution |
|-------|----------------|
| **OAuth redirect / base URL** | Document in `.env.example` and README that **`AUTH_URL`** must be the full public origin: local `http://localhost:3000`; production example `https://sei-learning-coaches.azurewebsites.net` for Azure App Service. Note that Auth.js v5 uses `AUTH_URL` (not `NEXTAUTH_URL` in this codebase). |
| **Entra redirect** | **PR action item for Antonio**: add the deployed app URL (same origin as `AUTH_URL`) as a valid **redirect URI** in the Azure AD app registration. |
| **External dependency owners** | No ticket IDs in the spec. Owners are maintained in [bootstrap-summary.md](../../bootstrap-summary.md) **Open Dependencies** table; PR description should reference that table instead of duplicating rows. |

## Requirements (mandatory)

### Functional Requirements

- **FR-001**: `.env.example` MUST list **every** environment variable referenced by the application (or documented as optional with a comment). Each entry MUST include a one-line purpose and, where helpful, a pointer to README or spec for deeper context.
- **FR-002**: README MUST include an **Azure deployment** (or “Deployment and Azure”) section that explains: (a) default `KNOWLEDGE_PROVIDER=supabase` for immediate review; (b) `KNOWLEDGE_PROVIDER=azure` once `AzureKnowledgeProvider` is implemented; (c) that swapping is a single env change at the app boundary, not a rewrite of Guide routes.
- **FR-003**: README MUST document the **ElevenLabs Custom LLM** integration: full URL pattern `https://<deployment-host>/api/voice-llm/chat/completions`, Bearer token env var `INTERVIEW_COACH_CUSTOM_LLM_API_KEY`, and that this route does **not** use `auth()` (user session); it uses the shared secret — consistent with SEI-51.
- **FR-004**: The PR readiness **checklist** MUST be runnable (script or numbered steps in README or GUIDE) and include at minimum: `npm run ensure:build` (or `lint` + `build` as documented), `npm test` if Vitest is part of the project, greps for architectural boundaries (e.g. Supabase imports under `app/` for knowledge), and **401** checks for protected endpoints listed in the spec.
- **FR-005**: Deliverable MUST include a **suggested final commit message** (single-line or short body) suitable for merge to `main`, prefixed with `SEI-53` per project convention.
- **FR-006**: Documentation MUST point readers to **open dependencies** via the **Open Dependencies** table in [bootstrap-summary.md](../../bootstrap-summary.md) (owners and status). Do **not** duplicate that table in the spec or README; PR description references `bootstrap-summary.md` instead.

### Key Entities (if feature involves data)

- **Environment configuration**: Key-value pairs loaded at runtime; no new entities in the database for this ticket.

### Non-Functional Requirements

- **NFR-001**: **Security** — Documentation does not encourage copying secrets into the repo; Custom LLM key remains server-only.
- **NFR-002**: **Maintainability** — When new env vars are added in future code, contributors update `.env.example` in the same PR or a follow-up (note in README optional).

## Success Criteria (mandatory)

### Measurable Outcomes

- **SC-001**: `.env.example` is complete and reviewed against a codebase grep for `process.env.` (or equivalent) so no variable is missing from the template.
- **SC-002**: README contains a dedicated deployment/Azure-oriented section satisfying FR-002 and FR-003.
- **SC-003**: PR readiness checklist runs successfully on the branch before merge (build green, lint green, tests green if applicable, manual 401 checks pass as documented).
- **SC-004**: Open dependencies remain authoritative in `bootstrap-summary.md`; README or PR text references that table only.
- **SC-005**: Suggested commit message for the PR is prepared and references SEI-53.

## Implementation Notes (non-binding)

- Prefer extending existing README “Note for PR Reviewers” rather than duplicating; merge Azure deployment content into a clear section.
- ElevenLabs dashboard configuration for Custom LLM must point to the **public** HTTPS URL of the deployed Next.js app plus `/api/voice-llm/chat/completions`.
- **`AUTH_URL`** in production must match the deployed Azure App Service origin (see Auth.js docs). Include **Antonio redirect-URI** action item in the PR description.
- **PR description template**: Link [bootstrap-summary.md](../../bootstrap-summary.md) Open Dependencies; add **Action item (Antonio)**: register redirect URI in Entra for the production `AUTH_URL` origin.
