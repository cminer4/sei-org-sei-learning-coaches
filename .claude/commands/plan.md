---
name: plan
description: Create a detailed implementation plan after exploration and design are complete. Translates requirements into a technical roadmap in business language. Acts as a technical architect presenting a project plan.
argument-hint: [Linear ticket ID or spec path, e.g. ENG-123 or specs/features/user-auth.md]
disable-model-invocation: true
---

# Plan Command

Create a detailed implementation plan after exploration and design are complete. Translates requirements into a technical roadmap while keeping explanations in business language. Acts as a technical architect presenting a project plan. **No code will be written** — this is planning only.

## Input

**What to plan**: `$ARGUMENTS`

Accepts either:
- **Linear ticket ID** (e.g., `ENG-123`) — Resolve to spec file via Linear MCP or by searching specs/features/
- **Spec filepath** (e.g., `specs/features/user-auth.md`) — Read the spec directly

---

## Prerequisites Check

Before creating the plan, verify:

1. **Spec exists** — The feature spec must exist. If not, inform the user: "Run /new-spec first to create the spec."
2. **Exploration** — Look for `specs/explorations/[feature-slug]-exploration.md`. If missing, warn: "⚠️ No exploration found. Consider running /explore first to identify ambiguities and risks."
3. **Design (for UI features)** — If the feature has user-facing screens, look for `specs/designs/[feature-slug]-design.md`. If missing, warn: "⚠️ No design exploration found. For features with screens, consider running /design first to align on user experience."
4. **Read [CLAUDE.md](CLAUDE.md)** — Load tech stack, Directory Contract, Architectural Constraints, Core Principles. All technical decisions must align with the constitution.

Proceed with the plan even if exploration or design are missing — the warnings help the founder decide whether to run those first.

---

## Output Format

Structure your response exactly as follows. Use **business language** throughout. Explain technical approach in terms of outcomes, not implementation details.

```markdown
## 📋 Implementation Plan: [Feature Name]

**Branch**: `[ticket-id]-[feature-slug]`
**Spec**: [link to spec file]
**Exploration**: [link if exists, or "Not yet run"]
**Design**: [link if exists, or "Not yet run"]
**Estimated Timeline**: [X days/weeks] — [brief reasoning]

### What We're Building (Summary)

[2-3 sentences in plain English: what this delivers to users, what problem it solves]

### Technical Approach

[Explain the approach in business terms. Break into pieces with time estimates.]

**Example:**
"We'll build this as 3 separate pieces:
1. Login screen (2 days) — Where users enter credentials
2. Password reset via email (2 days) — Users get a link to create new password
3. Security features to prevent hacking (1 day) — Rate limiting, secure sessions

This lets us test login first before adding password reset."

### Constitution Check

[Verify against CLAUDE.md principles]

- ✅ **Follows [Principle Name]**: [How it complies]
- ✅ **Uses approved tech stack**: [Specific technologies from constitution]
- ⚠️ **Exception needed**: [If any — explain why in business terms, or "None"]

### Files That Will Be Created/Modified

[Group by purpose, not by technical structure]

**User-Facing Changes**:
- [Screen/page name]: [What users will see or do here]

**Behind-the-Scenes**:
- [Component name]: [What business function this handles]

**Tests**:
- [Test suite]: [What scenarios we're testing]

### Dependencies

**Must Be Done First**:
- [Feature/task]: [Why it's needed first]

**Can Build in Parallel**:
- [Task A] and [Task B] are independent

**Blocks Future Work**:
- [Future feature] needs this completed first

### Test Strategy

[Explain testing in user-experience terms]

**What We'll Test**:
- **Happy path**: [Normal user flow]
- **Error cases**: [What happens when things go wrong]
- **Edge cases**: [Unusual but valid scenarios]

**How We'll Know It Works**:
- [Specific user action that proves feature works]

### Risks & Mitigations

| Risk | Impact on Business | How We'll Handle It |
|------|-------------------|---------------------|
| [e.g., Email delivery fails] | [Users can't reset password] | [Use reliable email service, add retry logic] |

### Implementation Phases

**Phase 1: Core Functionality** (Day 1-X)
- [What gets built]
- **Deliverable**: [What you can demo/test]

**Phase 2: Polish & Edge Cases** (Day X-Y)
- [What gets added]
- **Deliverable**: [What you can demo/test]

**Phase 3: Testing & Review** (Day Y-Z)
- [What gets verified]
- **Deliverable**: [Ready for users]

### Deployment Plan

**Feature Flag**: [Yes/No] — [If yes: "We'll hide this behind a feature flag so we can test with beta users before rolling out. Reduces risk."]

**Database Changes**: [Yes/No] — [If yes: "We need to add a new data table. This happens automatically, no downtime."]

**Rollback Strategy**: [How to undo if something breaks — e.g., "Turn off feature flag immediately. No data is lost."]

### Success Metrics

[How we'll measure if this worked]

- [Metric 1]: [What this tells us about success]
- [Metric 2]: [What this tells us about success]

### Timeline Breakdown

| Phase | Duration | Why This Long |
|-------|----------|---------------|
| [Phase 1] | [X days] | [Business reasoning] |
| [Phase 2] | [X days] | [Business reasoning] |
| [Phase 3] | [X days] | [Business reasoning] |

**Total**: [X days/weeks]
**Confidence**: [High/Medium/Low] — [Reasoning]

### What Could Make This Take Longer

- [Risk 1]: Could add [X days] if [scenario]
- [Risk 2]: Could add [X days] if [scenario]

### What's NOT Included

[Explicitly call out scope boundaries]

- [Feature that's similar but not in this plan]
- [Enhancement that can come later]

### Next Steps

1. Review this plan
2. Ask any questions using /explain
3. When ready: Run /implement to start building
4. I'll create git branch and begin Phase 1
```

---

## Save Plan

Save the full plan to:

```
specs/[feature-slug]/plan.md
```

Example: `specs/user-auth/plan.md`. Create the directory if it doesn't exist.

---

## Technical Decisions (Make Automatically)

**Do NOT ask the founder.** Make these decisions based on CLAUDE.md:

- **Which files to create/modify** — Use Directory Contract (e.g., `app/services/`, `src/components/`)
- **Which libraries/tools** — Use Tech Stack Anchoring table
- **How to structure code** — Use Architectural Constraints and Module Boundaries
- **Testing approach** — Use TDD requirements (test framework, location, coverage)
- **Agents (when the plan adds or changes agent rows)** — If the feature introduces new agents (e.g. via migration/SQL), the plan MUST ask/specify: *When adding a new agent, will developers set `agent_type` in the insert (e.g. 'Guide') or leave it null so the admin assigns it in Prompt Control before activating?* Include this in the plan's Deployment Plan or Implementation Notes and in any migration/spec so the choice is documented. See CLAUDE.md Gotchas ("Adding new agents").

---

## Communication Rules (Non-Technical Founder Mode)

### DO

- **Explain technical approach** in business outcomes ("We'll add caching to make the dashboard load 10x faster")
- **Provide timeline estimates** with reasoning ("2 days because we're reusing the pattern from the login screen")
- **Make all technical decisions** — Don't ask tech questions
- **Use familiar analogies** when helpful ("Same approach as Gmail's compose button")
- **Focus on "what gets delivered when"** — Not "how it's coded"

### DO NOT Ask

- ❌ "Should we use Redis for caching?"
- ❌ "Do you want REST or GraphQL?"
- ❌ "Should we implement optimistic locking?"
- ❌ "JWT or session-based auth?"

### DO Explain

- ✅ "I'll add caching to make the dashboard load 10x faster (industry standard practice)"
- ✅ "I'll build a standard web API (same approach as Twitter/Gmail use)"
- ✅ "I'll add safeguards so two people can't edit the same record simultaneously"

---

## Handling Input Types

### If $ARGUMENTS is a Linear ticket ID (e.g., ENG-123)

1. Search specs/features/ for a file matching the ticket ID (e.g., `ENG-123-*.md`).
2. If found, use that spec. If not, try Linear MCP to fetch the ticket and use its description.
3. Derive feature slug from spec filename or ticket title.

### If $ARGUMENTS is a spec filepath (e.g., specs/features/user-auth.md)

1. Read the spec file directly.
2. Derive feature slug from filename (e.g., `user-auth` from `user-auth.md` or `ENG-123-user-auth.md`).

### If Linear MCP is not available and input looks like a ticket ID

1. Search specs/features/ for matching file.
2. If not found, ask user to provide spec filepath.
