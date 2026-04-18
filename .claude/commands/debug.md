---
name: debug
description: Systematic bug investigation and fix workflow. Captures bug report, creates Linear ticket, investigates root cause, updates BUG-REGISTRY, and recommends constitution updates. Explains everything in business terms.
argument-hint: [bug description or Linear ticket ID, e.g. "Login fails with wrong password" or CM-8]
disable-model-invocation: true
---

# Debug Command

Systematic bug investigation and fix workflow. Captures the bug report, creates a Linear ticket, investigates root cause, updates the BUG-REGISTRY, and recommends constitution updates when the bug reveals systemic issues. Follow **Non-Technical Founder Mode** — all explanations in business terms.

## Input

**What to debug**: `$ARGUMENTS`

Accepts either:
- **Bug description** (e.g., "Users can't log in when they enter wrong password twice")
- **Linear ticket ID** (e.g., `CM-8`) — Use existing bug ticket
- **Spec filepath** (e.g., `specs/features/user-auth.md`) — Bug relates to this feature

---

## Phase 1: Bug Report

**First, display:**

```
🐛 DEBUG MODE — I'm investigating this bug and will document everything systematically.
```

### Capture Bug Report

1. **Parse the bug description** — Extract what the user reported in business terms.
2. **Ask clarifying questions** (if needed) — Business questions only:
   - "When does this happen? Every time or only sometimes?"
   - "What were you trying to do when it broke?"
   - "What did you expect to happen vs what actually happened?"
   - "Does it affect all users or just some?"
3. **Create structured bug report** — Save to `specs/bugs/[bug-slug]-report.md`:

```markdown
# Bug Report: [Short Title]

**Reported**: [ISO date]
**Status**: Investigating
**Linear Ticket**: [will be filled after creation]

## What the User Reported

[Description in plain English — what's broken from the user's perspective]

## Expected Behavior

[What should happen according to the spec or user expectation]

## Actual Behavior

[What actually happens — in user experience terms]

## Steps to Reproduce

1. [Step 1]
2. [Step 2]
3. [Bug occurs]

## Impact

- **User impact**: [How this affects users — e.g., "Users cannot reset password"]
- **Business impact**: [Revenue, trust, support load, etc.]
- **Severity**: [Critical / High / Medium / Low]

## Related Spec (if known)

[Link to spec file if bug relates to a specific feature]
```

---

## Phase 2: Linear Ticket Creation

1. **Create Linear ticket** via Linear MCP (if available):
   - **Title**: `[Bug]: [Short description]`
   - **Description**: Full bug report markdown from Phase 1
   - **Team**: User's default team
   - **Labels**: Add "bug" if available

2. **Update bug report** with ticket URL and ID in frontmatter and body.

3. **If Linear MCP not available**: Save report as-is, inform user to create ticket manually.

---

## Phase 3: Investigation

### Investigation Process

1. **Read [CLAUDE.md](CLAUDE.md)** — Understand tech stack, directory structure, architecture.
2. **Identify related spec** — If bug relates to a feature, read `specs/features/[feature].md` to understand intended behavior.
3. **Search codebase** — Find code that handles the failing scenario. Use grep, codebase search.
4. **Determine root cause** — Explain in business terms:
   - "The login screen wasn't checking for empty password — it tried to validate nothing"
   - "The password reset email link expires after 1 hour, but the spec said 24 hours — we built it wrong"
   - "Two users editing the same record at once causes data loss — we didn't handle concurrent updates"

5. **Spec vs implementation** — Decide:
   - **Spec was correct, code was wrong** → Fix code only
   - **Spec was wrong or incomplete** → Update spec first, then fix code
   - **New edge case** → Add to spec's Edge Cases, then implement handling

### Investigation Output

Add to bug report:

```markdown
## Investigation Results

**Root cause (in plain English)**: [What went wrong and why]

**Spec alignment**: [Spec was correct / Spec was wrong / Spec was incomplete / New edge case]

**Files involved**:
- [File]: [What role it plays in the bug]

**Fix approach**: [Brief description of what needs to change — business terms]
```

---

## Phase 4: BUG-REGISTRY Updates

### Create or Update BUG-REGISTRY

Maintain `specs/BUG-REGISTRY.md` (create if missing) with all documented bugs:

```markdown
# Bug Registry

Tracks bugs found during development. Used to prevent regressions and identify patterns.

## Format

| ID | Title | Severity | Root Cause | Spec Updated? | Fixed? |
|----|-------|----------|------------|--------------|--------|
| BUG-001 | Login fails with empty password | High | Missing validation | No | — |
```

**For this bug**:
1. Add row to BUG-REGISTRY with: ID (BUG-XXX), title, severity, root cause (one line), whether spec was updated, fix status.
2. Assign next BUG-ID (increment from last).
3. Link to full report: `specs/bugs/[slug]-report.md`
4. Link to Linear ticket.

### Update Bug Report

Set status to `Investigated` and add BUG-REGISTRY ID.

---

## Phase 5: Constitution Update Recommendations

**If the bug reveals a systemic issue**, recommend CLAUDE.md updates:

### When to Recommend

- **Pattern bugs** — Same type of bug could happen elsewhere (e.g., "We keep forgetting input validation")
- **Architecture gaps** — Bug exposed missing architectural constraint
- **Gotcha discovery** — Project-specific pitfall that should be documented
- **Process gaps** — TDD or spec process could have caught this earlier

### Recommendation Format

```markdown
## Constitution Update Recommendations

**Recommendation 1**: [If applicable]
- **Issue**: [What the bug revealed about our process or architecture]
- **Suggested CLAUDE.md update**: [Specific section and what to add]
- **Why**: [Business impact — prevents future bugs like this]

**Recommendation 2**: [If applicable]
...

**No recommendations**: [If bug was one-off implementation error with no systemic lessons]
```

### Example Recommendations

- "Add to Gotchas: 'Always validate user input on login form — we've had two bugs from missing validation'"
- "Add to Core Principles: 'All forms must validate required fields before submission'"
- "Add to Directory Contract: Validation logic lives in `app/validators/`"

---

## Phase 6: Deploy Fix

**Do NOT implement the fix automatically.** Present:

```markdown
## Ready to Fix?

**Root cause**: [One-line summary]
**Estimated fix time**: [X minutes/hours]
**Risk level**: [Low / Medium — e.g., "Touching auth code"]

**Next step**: Say "fix it" or "implement the fix" and I'll:
1. Apply the fix following TDD (test first, then code)
2. Update spec if needed, add tests, commit with ticket ID
3. **Automatically deploy** the fix when done (merge to main, run deployment)
```

If user says to fix: Implement following TDD, update spec if needed, add tests, commit with ticket ID. **Then automatically deploy** — merge to main, run deployment steps per project setup (CI/CD, manual deploy, etc.). Provide deployment status and rollback instructions.

---

## Phase 7: Summary Output

```markdown
## 🐛 Debug Summary: [Bug Title]

**Linear Ticket**: [URL]
**Bug Report**: specs/bugs/[slug]-report.md
**BUG-REGISTRY**: Updated (BUG-XXX)

### Root Cause
[One sentence in business terms]

### Spec Impact
[No change / Spec updated with edge case / Spec corrected]

### Constitution Recommendations
[List or "None — one-off bug"]

### Next Steps
1. [Review the fix approach]
2. [Say "fix it" to implement and deploy automatically, or fix manually]
3. [Update Linear ticket when fixed and deployed]
```

---

## File Structure

```
specs/
├── bugs/                   # Bug reports
│   └── [slug]-report.md
└── BUG-REGISTRY.md         # Master list of all bugs
```

---

## Communication Rules

- **Business language** — "Users can't log in" not "401 Unauthorized"
- **Explain root cause** — What went wrong and why, in plain English
- **Severity in user terms** — Critical = "Users can't use the app"; Low = "Minor display glitch"
- **No technical jargon** without explanation
- **Recommendations actionable** — Specific CLAUDE.md sections to update

---

## Handling Input Types

### If $ARGUMENTS is a bug description
→ Run Phase 1 (Bug Report), then Phase 2 (Linear), then Phase 3 (Investigation), etc.

### If $ARGUMENTS is a Linear ticket ID
→ Fetch ticket, use as bug report. Skip Phase 1–2, run Phase 3 (Investigation).

### If $ARGUMENTS is a spec filepath
→ Bug relates to this feature. Use spec for investigation context. Run full workflow.
