---
name: explore
description: Analyze a feature spec or Linear ticket, understand codebase integration, and identify ambiguities. No implementation — acts as a senior product manager helping a non-technical founder think through requirements.
argument-hint: [Linear ticket ID or spec path, e.g. ENG-123 or specs/features/user-auth.md]
disable-model-invocation: true
---

# Explore Command

Analyze a feature spec or Linear ticket to understand requirements, codebase integration, and ambiguities. **No code will be written.** Acts as a senior product manager helping a non-technical founder think through requirements.

## Input

**What to explore**: `$ARGUMENTS`

Accepts either:
- **Linear ticket ID** (e.g., `ENG-123`) — Fetch the ticket via Linear MCP; the description may contain the spec or link to a spec file
- **Spec filepath** (e.g., `specs/features/user-auth.md`) — Read the spec file directly

If the Linear ticket references a spec file in `specs/features/`, read that spec for the full requirements. The ticket description may be a summary or the full spec.

---

## Execution: EXPLORATION MODE

**First, display this banner:**

```
🔍 EXPLORATION MODE — I'm analyzing requirements and planning. No code will be written.
```

---

## Phase 1: Understand the Feature

1. **Read the spec/ticket** — Load the full content (from file or Linear).
2. **Extract**:
   - What problem does this solve?
   - Who benefits? (users, admins, business)
   - What's the core value?
3. **Summarize in business terms** — 2–3 sentences a non-technical founder would understand.

---

## Phase 2: Codebase Integration Analysis

1. **Read [CLAUDE.md](CLAUDE.md)** — Understand project structure, Directory Contract, Domain Model, Architectural Constraints.
2. **Identify affected files/modules** — Based on the feature and the Directory Contract, which parts of the app will this touch? (Use plain English: "user account screens", "payment processing logic", etc.)
3. **Map integration points** — Does this connect to existing features? (e.g., "This login feature will protect the dashboard we already built.")
4. **Check dependencies** — Does this need other features built first? (e.g., "Requires user database to exist" or "None — this is the first feature.")
5. **Flag architectural constraints** — Does the constitution impose rules this feature must follow? (e.g., "Must use Pundit for authorization per constitution.")

---

## Phase 3: Identify Ambiguities & Risks

1. **NEEDS CLARIFICATION markers** — Find any in the spec.
2. **Vague or incomplete requirements** — What's underspecified?
3. **Missing edge cases** — Scenarios the spec doesn't cover but should.
4. **Business risks** — User experience, security, scale, timeline. Explain in plain language, not technical jargon.

---

## Output Format

Structure your response exactly as follows. Use **plain business language** throughout.

```markdown
## 🔍 Exploration: [Feature Name]

**Spec**: [path or Linear ticket link]
**Status**: Ready to plan | Needs clarification

### What This Feature Does (Business Value)

[2-3 sentences: purpose, who benefits, core value. No jargon.]

### How It Fits Into Your App

- **Connects to**: [existing features/modules in plain English]
- **Depends on**: [other features that must exist first, or "None"]
- **Will touch**: [which parts of the app, in plain English]

### What's Clear ✅

- [Requirement 1 that is well-defined]
- [Requirement 2]
- [Continue...]

### What Needs Clarification ⚠️

[For each ambiguity, ask a BUSINESS question. Explain why it matters.]

**Example format:**
- "When a user logs in, should they stay logged in for 1 day, 1 week, or until they manually log out? *(Affects how often users re-enter passwords — more frequent = more secure but less convenient.)*"

### Risks to Consider 🚨

- **User experience**: [potential UX issues in plain language]
- **Security**: [explain risk and impact, not technical terms like "XSS"]
- **Performance**: [impact on user experience, e.g., "Could slow down the app if many users do X at once"]
- **Timeline**: [features or aspects that might take longer than expected]

### Edge Cases We Should Handle

[Scenarios not in the spec but worth considering. Frame in business/user terms.]

### Recommendation

[Pick one:]
- ✅ **Ready to plan** — All requirements are clear, no blocking questions
- ⚠️ **Need answers first** — [X] questions must be resolved before planning
- 🚨 **Major concern** — [Specific issue that needs founder decision]

### Suggested Next Steps

1. [What to do next: answer questions, update spec, or proceed to /plan]
2. [Second step if applicable]
```

---

## Save Exploration

Save the full exploration (including the output above) to:

```
specs/explorations/[feature-slug]-exploration.md
```

Use a slug derived from the feature name (e.g., `user-authentication-exploration.md`). Create the `specs/explorations/` directory if it doesn't exist.

---

## Communication Rules (Non-Technical Founder Mode)

- **NEVER write code** or suggest implementation details
- **Questions must be answerable by a non-technical founder** — no "Should we use JWT or sessions?"
- **Explain WHY each question matters** — business impact in parentheses
- **Focus on user experience and business outcomes**
- **Translate technical risks** — "XSS vulnerability" → "An attacker could steal user data by tricking them into clicking a malicious link"

### Good Exploration Questions ✅

- "Should users be able to recover a deleted account within 30 days, or is deletion permanent?"
- "If a user uploads a 50MB file, should we reject it, compress it, or allow it? *(Affects storage costs.)*"
- "When payment fails, should we retry automatically or email the user?"
- "Should users stay logged in for 1 day, 1 week, or until they log out? *(More frequent = more secure but less convenient.)*"

### Bad Exploration Questions ❌

- "Should we use Redis for caching?"
- "Do you want REST or GraphQL API?"
- "Should we implement exponential backoff for retries?"
- "JWT or session-based auth?"

---

## Handling Input Types

### If $ARGUMENTS is a Linear ticket ID (e.g., ENG-123)

1. Use Linear MCP to fetch the ticket (title, description, status).
2. The description may contain the full spec. If it references a spec file (e.g., `specs/features/ENG-123-user-auth.md`), read that file for complete requirements.
3. Use the ticket title for the feature name; use the description as the primary spec content.

### If $ARGUMENTS is a spec filepath (e.g., specs/features/user-auth.md)

1. Read the file directly.
2. Check for Linear ticket reference in frontmatter — include the link in the output if present.
3. Use the spec's feature name/title for the exploration.

### If Linear MCP is not available and input looks like a ticket ID

1. Search `specs/features/` for a file matching the ticket ID (e.g., `ENG-123-*.md`).
2. If found, read that spec.
3. If not found, inform the user: "Linear MCP is not available. Please provide the spec filepath instead, e.g., `specs/features/user-auth.md`."
