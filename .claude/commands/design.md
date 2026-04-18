---
name: design
description: Explore UI/UX options for a feature early in the process. Helps non-technical founder visualize the user experience and make design decisions before implementation. Acts as a product designer presenting concepts.
argument-hint: [Linear ticket ID, spec path, or feature description, e.g. ENG-123 or specs/features/user-dashboard.md]
disable-model-invocation: true
---

# Design Command

Explore UI/UX options for a feature early in the process. Helps a non-technical founder visualize the user experience and make design decisions before implementation. Acts as a product designer presenting concepts. **No code or technical implementation details.**

## Input

**What to design**: `$ARGUMENTS`

Accepts any of:
- **Linear ticket ID** (e.g., `ENG-123`) — Fetch via Linear MCP; use ticket description as spec
- **Spec filepath** (e.g., `specs/features/user-dashboard.md`) — Read the spec directly
- **Feature description** (e.g., "user authentication flow") — Use as the feature to design; optionally search for a related spec

---

## Execution: Read Context

Before designing, read:

1. **Feature spec/ticket** — Understand requirements, user stories, acceptance criteria
2. **[CLAUDE.md](CLAUDE.md)** — Check for brand guidelines, design patterns, domain model
3. **specs/explorations/** — If an exploration exists for this feature (e.g., `user-dashboard-exploration.md`), read it for context on ambiguities and risks

---

## Output Format

Structure your response exactly as follows. Use **non-technical language** throughout.

```markdown
## 🎨 Design Exploration: [Feature Name]

### User Journey

[Walk through the experience step-by-step as if telling a story. Use a persona name (e.g., "Sarah") to make it concrete.]

**Example format:**
"When Sarah wants to log in, she'll:
1. See a simple login screen with email and password fields
2. Click 'Log In' and see a loading indicator
3. Land on her dashboard showing her recent activity

If she forgets her password:
1. Clicks 'Forgot Password' link
2. Enters her email
3. Gets an email with a reset link
4. Creates a new password"

### Screen Breakdown

[For each main screen/page:]

#### Screen: [Name]
**Purpose**: [What user accomplishes here]
**Key Elements**:
- [Element 1]: [What it does, why it's there]
- [Element 2]: [What it does, why it's there]

**User Actions**:
- [What user can do on this screen]

**Success State**: [What happens when everything works]
**Error State**: [What user sees if something goes wrong]

### Information Hierarchy

[What's most important for user to see first]

**Example format:**
"Priority 1: User's name and current status
Priority 2: Recent activity
Priority 3: Navigation to other features"

### Interaction Patterns

[How user interacts with the feature. Use familiar app comparisons.]

**Examples:**
- "One-click action (like Amazon's Buy Now button)"
- "Multi-step wizard (like Airbnb's listing creation)"
- "Drag-and-drop (like Trello)"
- "Search and filter (like LinkedIn job search)"

### Design Decisions to Make

[Present options in business terms with clear recommendations. Include pros/cons and why the recommendation matters.]

**Example format:**
"**Decision**: How should users navigate between sections?

Option A: Top navigation bar (like Gmail)
- Pro: Familiar, works on all screen sizes
- Con: Takes up screen space

Option B: Sidebar (like Spotify)
- Pro: More room for navigation options
- Con: Harder on mobile

**Recommendation**: Top navigation — your users will access this on mobile, and familiarity reduces learning curve."

### Accessibility Considerations

[How this works for all users. Plain language.]

- **Keyboard navigation**: [How users navigate without a mouse]
- **Screen readers**: [How visually impaired users use this]
- **Mobile**: [How this adapts to small screens]

### Brand Alignment

[Check against any brand guidelines or design patterns in CLAUDE.md]

- Does this match existing design patterns?
- Any new patterns to add to the constitution?

### Things We're NOT Designing

[Explicitly call out what's out of scope for this feature]

### Next Steps

1. Review this design exploration
2. Answer the design decisions above
3. I'll update the spec with approved design
4. Then we can run /plan to create technical implementation
```

---

## Save Design Exploration

Save the full design exploration to:

```
specs/designs/[feature-slug]-design.md
```

Use a slug derived from the feature name (e.g., `user-dashboard-design.md`). Create the `specs/designs/` directory if it doesn't exist.

---

## Suggest Constitution Updates

If the design introduces patterns that should apply project-wide:

- Add a note in **Brand Alignment** or a new section: **Suggested Constitution Update**
- Example: "This navigation pattern (top bar with 3-5 items) should become the standard for all list views. Recommend adding to CLAUDE.md under a new 'Design Patterns' section."
- Do NOT edit CLAUDE.md automatically — suggest the update and let the founder approve.

---

## Communication Rules

### DO

- **Use analogies** to familiar apps (Gmail, Amazon, Spotify, Airbnb, Trello, LinkedIn)
- **Explain design choices** in terms of user experience, not aesthetics
- **Focus on "what user sees and does"** — not how it's built
- **Present design decisions** as business tradeoffs (time, user experience, mobile vs desktop)
- **Be opinionated** — give clear recommendations with reasoning
- **Use plain language** — if you must use a design term, explain it in parentheses

### DO NOT

- Discuss CSS, HTML, or any code
- Mention technical implementation details (APIs, databases, frameworks)
- Use design jargon without explaining (avoid "affordance", "gestalt", "F-pattern", etc.)
- Show code examples
- Ask technical questions ("Should we use a modal or a drawer?" — reframe as: "Should the form appear in a popup (like Gmail's compose) or slide in from the side (like Spotify's queue)?")

---

## Handling Input Types

### If $ARGUMENTS is a Linear ticket ID (e.g., ENG-123)

1. Use Linear MCP to fetch the ticket (title, description).
2. Use the description as the spec. If it references a spec file, read that for full requirements.
3. Use the ticket title for the feature name.

### If $ARGUMENTS is a spec filepath (e.g., specs/features/user-dashboard.md)

1. Read the spec file directly.
2. Use the spec's feature name/title.
3. Check for a matching exploration in specs/explorations/.

### If $ARGUMENTS is a feature description (e.g., "user authentication flow")

1. Search specs/features/ for a related spec (by filename or content).
2. If found, use that spec. If not, design from the description alone.
3. Check specs/explorations/ for related exploration.

### If Linear MCP is not available and input looks like a ticket ID

1. Search specs/features/ for a file matching the ticket ID (e.g., `ENG-123-*.md`).
2. If found, use that spec.
3. If not found, ask the user to provide the spec filepath or feature description.
