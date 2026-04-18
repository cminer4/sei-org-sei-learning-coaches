---
name: new-spec
description: Create a new feature spec from a description, save to specs/features/, create Linear ticket, and update spec with ticket URL. Use when starting work on a new feature.
argument-hint: [feature description, e.g. "Add user authentication"]
disable-model-invocation: true
---

# New Feature Spec Command

Create a comprehensive feature specification from the user's description. This command is **technology-agnostic** and adapts to whatever tech stack and domain are defined in CLAUDE.md.

## Input

**User description**: `$ARGUMENTS`

## Execution Steps

### 1. Read CLAUDE.md

Read [CLAUDE.md](CLAUDE.md) to understand:

- **Tech Stack Anchoring** — Language, framework, testing, build, data. Use this to tailor the spec (e.g., mention RSpec vs Jest, Rails vs Next.js).
- **Domain Model** — Core entities, flows, and terms. Reference these when the feature touches existing domain concepts.
- **Directory Contract** — Where code lives (e.g., `app/services/`, `src/components/`). Use in requirements when specifying where new code goes.
- **Naming Conventions** — File naming, class naming, etc. Apply these in the spec.
- **Gotchas** — Project-specific pitfalls. Ensure the spec accounts for them if relevant.

### 2. Generate Feature Slug

Convert the user description to a kebab-case slug for the filename. Examples:

- "Add user authentication" → `user-authentication`
- "Add user dashboard with activity feed" → `user-dashboard-activity-feed`
- "Password reset flow" → `password-reset-flow`

### 3. Generate the Spec

Create a comprehensive spec using this **exact structure**. Fill in all sections with project-appropriate content derived from CLAUDE.md and the user description.

```markdown
# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[TICKET-ID]-[feature-slug]`
**Created**: [ISO DATE, e.g. 2026-02-14]
**Status**: Draft
**Linear Ticket**: [will be filled after creation]
**Input**: User description: "$ARGUMENTS"

## User Scenarios & Testing (mandatory)

<!-- Prioritization: User stories are ordered by P1 (critical path) first, then P2 (important), then P3 (nice-to-have). Each story must be independently testable without depending on other stories. -->

### User Story 1 - [Title] (Priority: P1)
[Description of the primary user flow]
**Why this priority**: [Explanation of why this is critical path]
**Independent Test**: [How to test this story standalone, without other stories]
**Acceptance Scenarios**:
1. **Given** [initial state], **When** [user action], **Then** [expected outcome]
2. **Given** [state], **When** [action], **Then** [outcome]

### User Story 2 - [Title] (Priority: P2)
[Description]
**Why this priority**: [Explanation]
**Independent Test**: [How to test standalone]
**Acceptance Scenarios**:
1. **Given** [state], **When** [action], **Then** [outcome]

### Edge Cases
<!-- ACTION REQUIRED: Review and add edge cases specific to this feature. Consider: validation failures, concurrent access, empty states, error recovery, boundary conditions. -->
- [Edge case 1]
- [Edge case 2]

## Requirements (mandatory)

### Functional Requirements
- **FR-001**: System MUST [capability with clear acceptance criteria]
- **FR-002**: System MUST [capability]
- **FR-003**: [Capability] — NEEDS CLARIFICATION: [What needs to be decided or clarified]
- **FR-004**: [Capability] — NEEDS CLARIFICATION: [Open question]

### Key Entities (if feature involves data)
- **[EntityName]**: [Description and attributes if applicable]
- **[EntityName]**: [Description]

### Non-Functional Requirements (if applicable)
- **NFR-001**: [Performance, security, or other NFR]

## Success Criteria (mandatory)

### Measurable Outcomes
- **SC-001**: [Metric or outcome that can be verified]
- **SC-002**: [Metric or outcome]
```

**Guidelines for filling the spec**:

- Derive **User Stories** from the user description. P1 = core flow; P2 = important supporting flows; P3 = enhancements.
- **Acceptance Scenarios** must use Given/When/Then format and be testable.
- **Functional Requirements** must be specific to the tech stack (e.g., "Controller MUST authorize via Pundit" for Rails; "API endpoint MUST return 401 for unauthenticated requests").
- Include at least one **NEEDS CLARIFICATION** marker where the user description is ambiguous.
- **Key Entities** only if the feature creates or significantly changes data models.
- **Success Criteria** must be verifiable (e.g., "All P1 acceptance scenarios pass", "Test coverage ≥ 80% for new code").

### 4. Save Spec to File

Save the generated spec to:

```
specs/features/[feature-slug].md
```

Use the slug from step 2. Do **not** include a ticket ID in the filename yet (we add it after creating the Linear ticket).

### 5. Create Linear Ticket

Use the Linear MCP server (if available) to create a ticket:

- **Title**: [Feature Name] (e.g., "User Dashboard with Activity Feed")
- **Description**: The **full spec markdown** (the entire generated spec content)
- **Team**: Use the default or user's team if determinable

If Linear MCP is **not available**:

- Save the spec as-is
- Inform the user: "Spec saved to `specs/features/[feature-slug].md`. Linear MCP is not available — please create the Linear ticket manually, add the ticket URL and ID to the spec frontmatter, and optionally rename the file to `{TICKET-ID}-{feature-slug}.md`."
- Skip step 6

### 6. Update Spec with Linear Ticket

After creating the Linear ticket:

1. Add or update the frontmatter at the top of the spec:

```yaml
---
linear: [Linear ticket URL from API response]
ticket: [Linear ticket ID, e.g. ENG-123]
---
```

2. Replace `**Linear Ticket**: [will be filled after creation]` with the actual ticket URL in the spec body.

3. Replace `**Feature Branch**: \`[TICKET-ID]-[feature-slug]\`` with the actual branch name (e.g., `ENG-123-user-dashboard-activity-feed`).

4. **Optionally** rename the file to `specs/features/[TICKET-ID]-[feature-slug].md` to match the naming convention in GUIDE.md. If you rename, update any references.

### 7. Report Back

Summarize for the user:

- Spec saved to: `specs/features/[filename].md`
- Linear ticket: [URL] (or note that they need to create it manually)
- Suggested branch: `[ticket-id]-[feature-slug]`
- Next step: Review the spec, resolve NEEDS CLARIFICATION items, then proceed to implementation per GUIDE.md

## Example Usage

```
/new-spec Add user dashboard with activity feed
```

This produces a spec at `specs/features/user-dashboard-activity-feed.md` (or `ENG-XXX-user-dashboard-activity-feed.md` after Linear ticket creation), with user stories, requirements, and success criteria tailored to the project's tech stack and domain from CLAUDE.md.
