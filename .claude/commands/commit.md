---
name: commit
description: Create a well-formatted git commit with clear message following project conventions. Links commits to Linear tickets.
argument-hint: [commit message, e.g. "Add login form validation"]
disable-model-invocation: true
---

# Commit Command

Create clean, descriptive git commits that document your work clearly. Acts as your version control expert ensuring commits follow best practices.

---

## Phase 1: Determine What's Being Committed

**Check current git status:**
```bash
git status
```

**Analyze changes:**
- What files changed?
- What's the scope of changes? (single feature, bug fix, documentation, refactor)
- Is this related to a Linear ticket?

**If no changes staged:**
Ask user: "I don't see any staged changes. Would you like me to:
1. Stage all changes (`git add .`)
2. Stage specific files (tell me which)
3. Review what changed first (`git diff`)"

---

## Phase 2: Determine Commit Type & Message

**Commit types** (use conventional commits format):

- `feat:` New feature for users
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Code formatting (no logic change)
- `refactor:` Code restructuring (no behavior change)
- `test:` Adding or updating tests
- `chore:` Build process, dependencies, tooling

**If user provides message** (e.g., `/commit Add login validation`):
- Use their message as the description
- Determine appropriate type prefix
- Format properly

**If user provides NO message** (just `/commit`):
- Analyze the changed files
- Propose a commit message based on changes
- Ask for confirmation

**Message format:**
```
[TYPE]: [Short description in present tense]

[Optional longer explanation if needed]

[Optional Linear ticket reference]
```

---

## Phase 3: Linear Ticket Integration

**Check if changes relate to Linear ticket:**

1. Look for Linear ticket reference in:
   - Branch name (e.g., `ENG-123-user-auth`)
   - Recent commits
   - Spec files being modified

2. **If ticket found:**
   - Include in commit message: `Refs: ENG-123`
   - Or full link: `Linear: https://linear.app/workspace/issue/ENG-123`

3. **If no ticket found but should have one:**
   - Ask: "These changes look like feature work. Is this related to a Linear ticket?"
   - If yes, include reference
   - If no, proceed without reference

**Commit message with ticket:**
```
feat: Add email validation to login form

- Validates email format before submission
- Shows error message for invalid emails
- Prevents form submission if email invalid

Refs: ENG-123
```

---

## Phase 4: Commit Message Quality Check

**Good commit messages:**
- ✅ Clear what changed from message alone
- ✅ Present tense ("Add feature" not "Added feature")
- ✅ Specific enough to understand months later
- ✅ Includes "why" if not obvious

**Examples of GOOD commits:**
```
feat: Add password reset flow via email
fix: Prevent double-submit on payment form
docs: Update README with deployment instructions
refactor: Extract payment logic to separate service
test: Add tests for date validation edge cases
```

**Examples of BAD commits:**
```
❌ "updates" (what updates?)
❌ "fix stuff" (what stuff?)
❌ "WIP" (not descriptive)
❌ "asdf" (not helpful)
❌ "Final commit" (not specific)
```

**If user's message is too vague:**
- Suggest a more descriptive version
- Explain why specificity helps
- Get approval before committing

---

## Phase 5: Execute Commit

**Standard commit:**
```bash
git add [files]
git commit -m "[TYPE]: [Message]"
```

**Commit with body:**
```bash
git commit -m "[TYPE]: [Short message]" -m "[Longer explanation]" -m "Refs: [TICKET]"
```

**Show result:**
```
✅ Committed: [commit hash]

[TYPE]: [Message]

Files changed: [count]
Insertions: [+X]
Deletions: [-Y]

[If ticket reference] Linked to: ENG-123
```

---

## Phase 6: Post-Commit Guidance

**After successful commit, inform user:**
```
✅ Changes committed successfully

**What's next?**
- More work on this feature? → Keep coding, commit again when ready
- Feature complete? → Run `/review [TICKET-ID]` before deploying
- Ready to ship? → Run `/deploy [TICKET-ID]` to go live

**Git status:**
- Branch: [branch-name]
- Commits ahead of main: [X]
- Ready to push? (if working with remote)
```

**If on feature branch:**
Remind: "You're on branch `[branch-name]`. Don't forget to push when ready: `git push origin [branch-name]`"

---

## Special Cases

### Amending Last Commit

If user wants to modify the last commit:
```
User: "Actually, add that file to the last commit"

Response: "I can amend the last commit to include [file]. This will:
- Add [file] to the previous commit
- Keep the same commit message
- Change the commit hash (don't do this if already pushed)

Proceed? (yes/no)"
```

If approved:
```bash
git add [file]
git commit --amend --no-edit
```

### Partial Commits

If user wants to commit only some changes:
```bash
# Stage specific files
git add path/to/file1.js path/to/file2.js
git commit -m "[message]"
```

### Commit and Push

If user says "commit and push":
```bash
git commit -m "[message]"
git push origin [branch-name]
```

Show push result and confirm.

---

## Communication Rules (Non-Technical Founder Mode)

### Explaining Commits

**Good** (Business Language):
- ✅ "Saving a checkpoint: Finished the login form with email validation"
- ✅ "Committing your changes so you have a restore point if needed"
- ✅ "This creates a snapshot you can return to later"

**Bad** (Technical Jargon):
- ❌ "Creating SHA-1 hash object in git object database"
- ❌ "Staging changes to index before commit"
- ❌ "HEAD now points to new commit ref"

### Explaining Why Commit Messages Matter

**Good explanation:**
"Think of commits like entries in a logbook. Six months from now, when something breaks, you'll look through this logbook to find when a change was made. 'Add password reset' tells you exactly what happened. 'Fix stuff' tells you nothing."

---

## Examples

### Example 1: Feature Work

**User:** `/commit Added the dashboard`

**Analysis:**
- Changed files: src/app/dashboard/page.tsx, src/components/DashboardCard.tsx
- This is new feature work
- Branch name: eng-456-portfolio-dashboard
- Linear ticket: ENG-456

**Proposed commit:**
```
feat: Add portfolio-level dashboard with summary cards

- Created dashboard layout with grid system
- Added PropertyCard component for property summaries  
- Displays total properties and lease count
- Sticky header with navigation

Refs: ENG-456
```

**Response:** "I've committed your dashboard work with a descriptive message. The commit is linked to ticket ENG-456. Ready to keep building, or should we review?"

---

### Example 2: Bug Fix

**User:** `/commit`

**Analysis:**
- Changed: src/lib/auth.ts (1 file)
- Previous commit: "feat: Add login flow"
- Looks like a fix

**Proposed commit:**
```
fix: Prevent session timeout in Safari

Safari's strict cookie policy was expiring sessions immediately.
Updated cookie settings to be cross-browser compatible.

Refs: BUG-789
```

**Ask user:** "I see you fixed the Safari login issue from BUG-789. Should I commit with this message?"

---

### Example 3: Documentation

**User:** `/commit Updated the README`

**Analysis:**
- Changed: README.md only
- Type: docs

**Proposed commit:**
```
docs: Add deployment instructions to README

Includes step-by-step guide for:
- Environment variable setup
- Database migrations
- Production deployment
```

---

### Example 4: WIP Commit (End of Day)

**User:** `/commit Work in progress on payment flow`

**Response:**
```
I can commit this as work-in-progress, but heads up:

WIP commits should:
- Not be pushed to main branch
- Be cleaned up before review
- Include enough detail to pick up tomorrow

Suggested message:
"feat(wip): Payment flow - Stripe integration started

- Added Stripe SDK setup
- Created payment intent API route
- TODO: Add error handling and webhooks
- TODO: Add tests

Not ready for review"

Commit with this message? Or revise?
```

---

## Success Criteria

A good commit:
- ✅ Message clearly describes what changed
- ✅ Includes why if not obvious
- ✅ References Linear ticket if applicable
- ✅ Uses appropriate commit type prefix
- ✅ Will make sense 6 months from now
- ✅ Atomic (one logical change, not mixing unrelated changes)

---

## Configuration

**Commit message template** (if project has specific format):
Read from `.gitmessage` if exists, or use conventional commits format.

**Auto-linking to Linear:**
If branch name contains ticket ID (e.g., `eng-123-feature`), automatically include `Refs: ENG-123` in commit message.

---

**Remember:** Commits are documentation of your work. Future you (and other developers) will thank you for clear, descriptive commit messages.
