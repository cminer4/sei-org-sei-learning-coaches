---
name: implement
description: Execute the implementation plan by writing code, following TDD, and building the feature. Acts as a senior developer who keeps you informed of progress in plain language.
argument-hint: [Linear ticket ID or spec path, e.g. ENG-123 or specs/features/user-auth.md]
disable-model-invocation: true
---

# Implement Command

Execute the implementation plan by writing code, following TDD, and building the feature. Acts as a senior developer who keeps the founder informed of progress in plain language.

## Input

**What to implement**: `$ARGUMENTS`

Accepts either:
- **Linear ticket ID** (e.g., `ENG-123`) — Resolve to spec, then find plan
- **Spec filepath** (e.g., `specs/features/user-auth.md`) — Derive feature slug, find plan

---

## Prerequisites Check

**Before starting, verify:**

1. **Plan exists** — Look for `specs/[feature-slug]/plan.md`. If not found, **STOP** and inform the user: "No implementation plan found. Run /plan first to create the plan at specs/[feature-slug]/plan.md"
2. **Read [CLAUDE.md](CLAUDE.md)** — TDD requirements, Directory Contract, Code Style, Tech Stack
3. **Read the plan** — Implementation phases, files to create, dependencies, timeline

Do NOT proceed without a plan.

---

## Before Starting: Display Implementation Summary

**First, display this to the user:**

```markdown
## 🚀 Starting Implementation: [Feature Name]

**Plan**: [link to plan.md]
**Estimated Time**: [from plan]
**Approach**: [brief summary of technical approach from plan]

I'll follow TDD (Test-Driven Development):
1. Write tests first (Red)
2. Write minimal code to pass tests (Green)
3. Clean up code (Refactor)

I'll update you after each phase completes.

**Ready to start? I'll begin with Phase 1...**
```

Then proceed to implementation. Do not wait for user confirmation unless the command explicitly requires it — the user invoked /implement to start.

---

## Implementation Process

**For each phase in the plan:**

### A. Announce Phase Start

```markdown
📍 Phase [X]: [Phase Name]
Goal: [What this phase delivers in user terms]
Files I'm creating/modifying: [list]
```

### B. Follow TDD Cycle (from CLAUDE.md)

1. **Write failing tests first** — Tests for the behavior this phase delivers
2. **Implement minimal code** — Only what's needed to pass tests
3. **Refactor and clean up** — Remove duplication, improve clarity
4. **Add comments** — Explain business logic (WHY, not just WHAT)

### C. Progress Updates (During Implementation)

After each significant step:

```markdown
✅ [Component name] — [What user can now do]
```

### D. Phase Complete

```markdown
✅ Phase [X] Complete
What works now: [Describe in user experience terms]
Tests passing: [X/X]
Next: Moving to Phase [Y]
```

---

## Communication During Implementation

### Progress Updates (Business Language)

**✅ Good:**
- "Login screen is working — users can enter email/password and see validation"
- "Password reset emails are sending correctly — tested with Gmail and Outlook"
- "Added security feature — prevents brute force hacking attempts"

**❌ Avoid:**
- "Implemented bcrypt hashing with salt rounds of 10"
- "Created UserController with authenticate action"
- "Wrote 47 unit tests for authentication module"

### When Something Is Unclear in the Spec

```markdown
⚠️ Quick Question: [Business question]
[Explain why this matters]

Options:
A. [Option with pros/cons]
B. [Option with pros/cons]

Recommendation: [Your suggestion with reasoning]

Should I proceed with [recommendation] or would you prefer [alternative]?
```

Pause for user response before proceeding if the decision affects implementation.

### When Hitting a Technical Blocker

```markdown
🚨 Hit a snag: [What's not working in plain English]
Impact: [How this affects timeline]
Solution: [What I'll do to fix it]
Timeline adjustment: [If any]
```

Then proceed with the solution. Do not ask technical questions.

---

## After All Phases Complete

### Build Health Verification

**Before displaying the summary or starting the dev server**, run `npm run ensure:build` (or `bash scripts/ensure-build-health.sh` if the script exists but the npm script is not configured).

- **ensure:build** runs build:clean → verify:build. If verification fails (e.g., styling not applied), it runs fix-webpack-error.sh and retries (up to 2 attempts).
- **Do not declare "Implementation Complete"** until ensure:build exits 0.
- If it fails after retries, **STOP**. Inform the user: "Build health verification failed. Styling or build cache may be corrupted. Try `bash scripts/fix-webpack-error.sh` then `npm run build` manually. [Share the output]"

**Only show "Implementation Complete" and start the dev server when build health passes.**

---

### Start Dev Server & Health Check

**After build verification passes**, ensure the user can test locally. Only say "App is running" when the health check passes.

1. **Check if a dev server is already running**
   - Run `lsof -i :3000` (or `:3001`, `:3002` if 3000 is in use) to see if something is listening
   - Or check for an existing `npm run dev` process
   - If a server is running, note the URL and port for the health check

2. **If no dev server is running**
   - Run `npm run dev` in the background
   - Wait for the startup output (Next.js, Vite, etc. prints the local URL)
   - Capture the URL/port from the terminal output (e.g., "Local: http://localhost:3000")
   - If the URL isn't printed, default to http://localhost:3000 (port 3000)

3. **Health check** (required before declaring success)
   - Wait ~5 seconds after starting the dev server
   - Run `bash scripts/verify-dev-server.sh [port]` (or `npm run verify:dev` if available)
   - Treat 2xx/3xx response as success; exit 0 = OK, exit 1 = not responding
   - **If health check fails** → Run `bash scripts/reset-dev-server.sh`, restart `npm run dev`, wait ~5 seconds, run health check again
   - **Only say "App is running" or "Implementation Complete" when the health check passes**
   - If it still fails after retry, inform the user: "Dev server started but isn't responding. Try `npm run dev:safe` or `bash scripts/reset-dev-server.sh` then `npm run dev`."

4. **Include the actual URL in Try It Out** — Use the verified localhost URL, not a placeholder

---

**Display this summary:**

```markdown
## ✅ Implementation Complete: [Feature Name]

### What's Ready
- [List user-facing capabilities]

### Tests Written
- [X] All happy path scenarios tested
- [X] Error cases covered
- [X] Edge cases handled

### Code Quality
- [X] Follows constitution principles
- [X] No code duplication
- [X] Well-commented for future developers

### Branch & Commits
**Branch**: `[ticket-id]-[feature-slug]`
**Commits**: [X] commits with clear messages

### What I Built (File Summary)
[List files created/modified with brief purpose in business terms]

### Next Steps
1. Run /review to do comprehensive pre-merge review
2. After review passes, merge and deploy

### Try It Out
**App is running.** Open [actual URL, e.g. http://localhost:3000] to test locally.

[Specific instructions on how to test the feature manually — e.g., "1. Go to the login page. 2. Enter email and password. 3. Click Sign in."]
```

---

## Save Implementation Log

Create/update `specs/[feature-slug]/implementation-log.md` with:

- All progress updates from the session
- List of all files created/modified
- Any decisions made during implementation (with reasoning)
- Any spec clarifications discovered
- Timeline (actual vs estimated if different)

---

## Git Workflow

1. **Create feature branch** — Use branch name from plan: `[ticket-id]-[feature-slug]`
2. **Atomic commits** — One logical change per commit
3. **Commit message format**: `[TICKET-ID] Description in plain English`
   - Example: `ENG-123 Add user login screen with email validation`
   - Example: `ENG-123 Add password reset email flow`
4. **Commit tests before implementation** — Verifiable TDD (tests in one commit, implementation in next)

---

## Code Standards (from CLAUDE.md)

- **Directory structure** — Follow Directory Contract exactly
- **Naming conventions** — Use constitution's naming (files, classes, methods)
- **Inline comments** — Explain WHY, not just WHAT
- **Functions** — Focused, single-purpose
- **No duplication** — Search for existing code before creating new

---

## TDD Enforcement (from CLAUDE.md)

- **ALWAYS write tests first** — Before any implementation code
- **Every feature must have tests for**:
  - Happy path (normal user flow)
  - Error cases (what happens when things fail)
  - Edge cases (unusual but valid scenarios)
- **Commit order** — Tests committed before implementation (visible in git history)

---

## Communication Rules

- **Regular progress updates** — Not just at the end; update after each phase and significant step
- **User experience terms** — Explain what's working for users, not technical details
- **Business questions** — When clarification needed, ask in business terms
- **Flag timeline impacts** — Immediately when something affects the estimate
- **Inform without overwhelming** — Keep founder informed without technical jargon

---

## Resolving Input to Plan

### From Linear ticket ID (e.g., ENG-123)

1. Search specs/features/ for `ENG-123-*.md` or `*-ENG-123*.md`
2. If found, extract feature slug (e.g., `ENG-123-user-auth.md` → `user-auth`)
3. Look for plan at `specs/user-auth/plan.md`
4. If no spec file, search specs/ for any folder or file containing the ticket ID

### From Spec filepath (e.g., specs/features/user-auth.md)

1. Extract feature slug: `user-auth` (from filename without extension)
2. Look for plan at `specs/user-auth/plan.md`

### If plan not found

Stop and say: "No implementation plan found at specs/[feature-slug]/plan.md. Run /plan first to create the plan."
