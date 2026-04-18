---
name: review
description: Comprehensive code review before merging. Check code quality, design, tests, security, and performance. Explain findings in business terms a non-technical founder can understand.
argument-hint: [Linear ticket ID, spec path, or branch name, e.g. ENG-123 or eng-123-user-auth]
disable-model-invocation: true
---

# Review Command

Act as a senior tech lead doing a comprehensive code review before merging. Check code quality, design, tests, security, and performance. Explain all findings in business terms a non-technical founder can understand.

## Input

**What to review**: `$ARGUMENTS`

Accepts any of:
- **Linear ticket ID** (e.g., `ENG-123`) — Resolve to spec, find branch (e.g., `eng-123-user-auth`)
- **Spec filepath** (e.g., `specs/features/user-auth.md`) — Derive feature slug, find branch
- **Git branch name** (e.g., `eng-123-user-auth`) — Review this branch directly

---

## What Gets Reviewed

- **All code changes** in the feature branch (vs main)
- **Tests and test coverage** — Happy path, errors, edge cases
- **Design implementation** — For UI features, compare to specs/designs/
- **Security considerations** — Passwords, user data, input validation
- **Performance impact** — Page load, database efficiency, scalability
- **Constitution compliance** — Tech stack, architecture, directory structure, TDD, code style
- **Comparison against spec** — Requirements met, gaps, improvements

---

## Review Process: Start with Summary

**First, display:**

```markdown
## 🔍 Code Review: [Feature Name]

**Branch**: [branch-name]
**Spec**: [link]
**Files Changed**: [X files]
**Lines Added/Removed**: [+X/-Y]

Starting comprehensive review...
I'm checking: Code quality, Tests, Design, Security, Performance, and Constitution compliance.
```

Then run the review. Use `git diff main...branch-name` (or equivalent) to see changes.

---

## Review Checklist and Output Format

Structure your response exactly as follows. Use **business language** throughout.

### ✅ What's Working Well

[Highlight good practices, well-implemented features]

**Examples:**
- "Login flow is smooth — users can authenticate in 2 clicks"
- "Error messages are clear and helpful for users"
- "Tests cover all the important user scenarios"

### 📋 Constitution Compliance

- **Tech Stack**: ✅ Uses approved technologies from CLAUDE.md
- **Architecture**: ✅ Follows [architecture style] from constitution
- **Directory Structure**: ✅ Files in correct locations
- **TDD**: ✅ Tests written before implementation (verified in git history)
- **Code Style**: ✅ Follows naming conventions

[If violations found:]
- ⚠️ **Exception**: [What violates constitution]
- **Why it matters**: [Business impact]
- **Recommendation**: [Fix or justify]

### 🎨 Design Review (for UI features)

**User Experience**:
- ✅ Matches design exploration from specs/designs/
- ✅ Works on mobile and desktop
- ✅ Accessible (keyboard navigation, screen readers)
- ✅ Clear error states and loading indicators

**Brand Consistency**:
- ✅ Follows brand guidelines from CLAUDE.md
- ⚠️ [Any inconsistencies with existing patterns]

### 🧪 Test Coverage

**What's Tested**:
- ✅ Happy path: [user can successfully complete main flow]
- ✅ Error cases: [handles failures gracefully]
- ✅ Edge cases: [unusual scenarios covered]

**Coverage**: [X%]
**Missing tests**: [If any scenarios aren't covered]

### 🔒 Security Check

[Explain security in business risk terms]

- ✅ **Password handling**: Encrypted properly, can't be stolen from database
- ✅ **User data**: Protected from unauthorized access
- ✅ **Input validation**: Prevents malicious data entry
- ⚠️ **Potential issue**: [If found, explain risk and fix in plain English]

**Example:**
"✅ Passwords are encrypted — even if our database is compromised, attackers can't read actual passwords"

### ⚡ Performance Check

[Explain performance in user experience terms]

- ✅ **Page load**: Under 2 seconds (industry standard)
- ✅ **Database queries**: Efficient, won't slow down with 10k users
- ⚠️ **Concern**: [If found, explain impact on users]

**Example:**
"⚠️ This dashboard loads all user data at once. Works fine now, but will slow down when a user has 1000+ items. Recommend adding pagination (can be done later)."

### 🚨 Blockers (Must Fix Before Merge)

[Critical issues that prevent shipping. If none, say "None."]

For each blocker:
- **Issue**: [What's wrong in plain English]
- **Why it matters**: [Business impact or user impact]
- **How to fix**: [Specific action needed]
- **Estimated time**: [How long fix will take]

**Example:**
"🚨 Password reset emails aren't sending
**Why it matters**: Users who forget passwords can't log back in
**How to fix**: Email service needs configuration update
**Time to fix**: 30 minutes"

### ⚠️ Concerns (Should Address)

[Important but not blocking issues. If none, say "None."]

**Example:**
"⚠️ Login button text says 'Submit' instead of 'Log In'
**Why it matters**: Less clear for users
**How to fix**: Change button text
**Time to fix**: 5 minutes"

### 💡 Suggestions (Nice to Have)

[Improvements for future. If none, say "None."]

**Example:**
"💡 Could add 'Remember Me' checkbox for convenience
**Why it's nice**: Users won't need to log in on trusted devices
**Effort**: 2 hours
**Recommend**: Save for v2 unless users request it"

### 📊 Comparison to Spec

**Requirements Met**: [X/Y]

- ✅ [Requirement from spec]: Implemented as specified
- ✅ [Requirement from spec]: Implemented with improvement [explain]
- ⚠️ [Requirement from spec]: Partially implemented [explain gap]
- ❌ [Requirement from spec]: Missing [explain why and impact]

### 📈 Code Quality Metrics

[Explain in maintainability terms]

- **Readability**: [Easy/Medium/Hard for future developers to understand]
- **Maintainability**: [Easy/Medium/Hard to modify later]
- **Code duplication**: [None found / X instances that should be consolidated]
- **Comments**: [Well-commented / Needs more explanation]

### 🎯 Overall Assessment

**Status**: [Ready to Merge / Needs Fixes / Major Concerns]

**Summary**: [2-3 sentences on overall quality]

**Confidence Level**: [High/Medium/Low] that this will work well in production

**Recommendation**:
- If ready: "✅ This is solid work. Ready to merge and deploy."
- If needs fixes: "⚠️ Fix [X] blockers first, then ready to merge."
- If major concerns: "🚨 We need to address [major issue] before shipping."

---

## Next Steps (After Review)

**If blockers exist:**
1. Address the [X] blockers listed above
2. Run /review again to verify fixes
3. Then proceed to merge and deploy

**If ready to merge:**
1. Merge branch into main
2. Run /deploy to handle deployment checklist
3. Monitor for any issues in production

**If major concerns:**
1. Let's discuss [specific concern]
2. Use /explain if you want more details on any issue
3. Decide whether to fix now or adjust scope

---

## Save Review

Save the full review to:

```
specs/[feature-slug]/review-[timestamp].md
```

Use ISO date format for timestamp (e.g., `review-2026-02-14T143022.md` or `review-20260214.md`). Create the directory if it doesn't exist.

---

## Review Depth by Feature Size

- **Small (1-2 files)**: Quick review, focus on critical issues (security, spec compliance)
- **Medium (3-10 files)**: Standard comprehensive review (all sections)
- **Large (10+ files)**: Extra thorough; consider noting: "This is a large change — consider breaking into smaller pieces for future features"

---

## Communication Rules

- **Business impact** — Explain technical issues in terms of user experience, risk, or cost
- **Severity levels** — Use Blockers / Concerns / Suggestions consistently
- **Explain WHY** — Always say why something matters, not just what's wrong
- **Actionable fixes** — Provide specific actions with time estimates
- **Encouraging** — Highlight what works well, not just what's wrong

---

## Good Review Comments ✅

- "The password reset flow works, but users have to check their email within 1 hour or the link expires. Consider extending to 24 hours — more user-friendly and industry standard."
- "Found a security issue: user emails are visible in the page source. This could enable spam. Fix: Hide emails from public view. Time: 1 hour."
- "Performance concern: Dashboard loads slowly with 100+ items. Won't be an issue until you have power users. Suggest monitoring and optimizing if it becomes a problem."

---

## Bad Review Comments ❌

- "N+1 query in UserController#index"
- "Missing database index on foreign key"
- "Should refactor this into a service object"

**Reframe in business terms:**
- "The user list page makes too many database calls — will slow down when you have 1000+ users. Fix: Load data in one query. Time: 2 hours."
- "This could cause slowdowns as data grows. Add an index. Time: 15 minutes."
- "This logic is mixed with display code — harder to maintain. Consider separating. Time: 1 hour."

---

## Resolving Input to Branch

### From Linear ticket ID (e.g., ENG-123)

1. Search for branch: `eng-123-*` or `ENG-123-*`
2. Or find spec: specs/features/ENG-123-*.md → derive slug → common branch pattern

### From Spec filepath (e.g., specs/features/user-auth.md)

1. Extract feature slug: `user-auth`
2. Search for branch containing slug: `*-user-auth` or `eng-*-user-auth`

### From Branch name (e.g., eng-123-user-auth)

1. Use directly
2. Extract feature slug from branch for spec/plan lookup

### If branch not found

"Could not find feature branch. Please provide the branch name, or ensure the branch exists and has been pushed."
