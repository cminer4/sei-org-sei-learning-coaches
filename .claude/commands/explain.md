---
name: explain
description: Translate any technical concept, decision, error, or term into business language a non-technical founder can understand.
argument-hint: [technical term, error message, decision, or tradeoff]
---

# Explain Command

Translate **any** technical concept, decision, error, or term into business language that a non-technical founder can understand.

## Input

**What to explain**: `$ARGUMENTS`

Examples:
- `/explain Why did you choose PostgreSQL?`
- `/explain What does this error mean: "CORS policy blocked"`
- `/explain What's technical debt?`
- `/explain Should I use microservices?`
- `/explain What's the risk of not having tests?`

## Execution Steps

### 1. Read CLAUDE.md

Load [CLAUDE.md](CLAUDE.md) for project context:

- **Tech Stack Anchoring** — Reference decisions already made (e.g., "We chose PostgreSQL because…").
- **Domain Model** — Connect technical concepts to the business domain when relevant.
- **Core Principles** — Cite constitution decisions (e.g., "Per our constitution, we use TDD because…").
- **Gotchas** — Mention project-specific context if it affects the explanation.

### 2. Check for Relevant Specs

If the topic relates to a feature or architecture decision, search `specs/features/` and `specs/architecture/` for relevant specs. Link to them when they add context (e.g., "See [user-authentication.md](specs/features/user-authentication.md) for how we handle this.").

### 3. Respond Using This Format

Structure your response exactly as follows. Include only sections that apply (e.g., skip "The Tradeoff" if there's no meaningful choice to present).

```markdown
## 🔍 Explanation: [Topic]

### In Plain English
[Explain like you're talking to a smart business person with zero coding knowledge. Use analogies to non-tech businesses when helpful. Zero jargon without explanation.]

### Why This Matters for Your Business
[Impact on: time to build, cost, user experience, risk, or growth. Be specific.]

### The Tradeoff (if applicable)
[Option A vs Option B in business terms. Only include when there's a real business decision to make.]

### Recommendation
[Clear, specific recommendation with reasoning. No open-ended questions. If the constitution or specs already decided, say so.]

### Related Concepts (optional)
[Other things the founder might want to understand, with brief one-line descriptions.]
```

## Communication Rules (from Non-Technical Founder Mode)

- **Zero jargon without explanation** — If you use a technical term, explain it in parentheses or immediately after.
- **Focus on business impact** — "This makes the app faster" not "This reduces query time by 200ms."
- **Use analogies** — Compare to filing cabinets, kitchens, spreadsheets, retail stores, etc.
- **Specific recommendations** — Tell them what to do and why. Avoid "It depends on your needs."
- **Reference the constitution** — When CLAUDE.md already has a decision, say "We've already decided this: [X] because [reason]."

## Example Output Style

**Example for "Why PostgreSQL?"**:

> Think of PostgreSQL like a highly organized filing cabinet for your data. I chose it because it's the industry standard (used by 90% of apps like yours), free, and extremely reliable. The alternative (MongoDB) is faster to start with but causes problems when your data gets complex. For your app, PostgreSQL is the right choice because [specific reason from your domain].

**Example for "CORS policy blocked"**:

> In Plain English: Your app is trying to talk to another website (like a payment processor), but that website's security rules are blocking the request. It's like a bouncer refusing entry because your ID doesn't match the guest list.

**Example for "technical debt"**:

> In Plain English: Technical debt is like taking shortcuts when building a house: you save time now, but you pay later with extra maintenance, bugs, and slower features. It's the cost of doing things the quick way instead of the right way.

## Do Not

- Ask technical questions back ("What database are you using?")
- Present options without explaining business impact
- Use unexplained acronyms or jargon
- Give vague, "it depends" answers without a clear recommendation
