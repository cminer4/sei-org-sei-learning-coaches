---
name: deploy
description: Guide deployment of a reviewed and approved feature. Ensures everything is ready for production, handles the deployment process, and documents what was shipped. Explains everything in business terms.
argument-hint: [Linear ticket ID, spec path, or branch name, e.g. ENG-123 or eng-123-user-auth]
disable-model-invocation: true
---

# Deploy Command

Guide deployment of a reviewed and approved feature. Acts as a deployment manager who ensures everything is ready for production, handles the deployment process, and documents what was shipped. Explains everything in business terms.

**Also triggered automatically** by `/debug` Phase 6 (Deploy Fix) when a bug fix is implemented — the debug command runs deployment steps after applying the fix.

## Input

**What to deploy**: `$ARGUMENTS`

Accepts any of:
- **Linear ticket ID** (e.g., `ENG-123`) — Resolve to spec, find branch and review
- **Spec filepath** (e.g., `specs/features/user-auth.md`) — Derive feature slug, find branch and review
- **Git branch name** (e.g., `eng-123-user-auth`) — Use directly

---

## Prerequisites Check

**Before proceeding, verify:**

1. **Review exists** — Look for `specs/[feature-slug]/review-*.md`. Use the latest by timestamp.
2. **Review status** — Read the review's Overall Assessment. Must be "Ready to Merge" or "Needs Fixes" (with fixes completed).
3. **No blockers** — If the latest review lists blockers, **STOP** and inform: "The latest review has [X] blockers that must be fixed first. Run /review again after addressing them."
4. **Read the plan** — `specs/[feature-slug]/plan.md` for deployment notes (feature flags, DB migrations, rollback)

Do NOT proceed if blockers exist in the latest review.

---

## Pre-Deployment Summary

**First, display:**

```markdown
## 🚀 Deployment Checklist: [Feature Name]

**Branch**: [branch-name]
**Spec**: [link]
**Review**: [link to latest review]
**Review Status**: [status from review]

I'm preparing to deploy this feature to production.
Let me verify everything is ready...
```

---

## Pre-Deployment Verification

Run checks and report results. Use business language.

### 📋 Pre-Deployment Verification

**Code Quality**:
- ✅ All tests passing ([X/X tests]) — Run test suite
- ✅ No blockers from code review — Verified above
- ✅ Branch is up to date with main — Run `git fetch` and compare
- ✅ **Build health passes** — Run `npm run ensure:build` before merge/deploy (or `bash scripts/ensure-build-health.sh`). This runs build:clean → verify:build; if styling verification fails, auto-fixes and retries. **Do not deploy a branch that does not build or fails build health verification.**

**Technical Readiness**:
- ✅ Database migrations ready [if applicable — check plan]
- ✅ Environment variables configured [if needed — check plan]
- ✅ Feature flag configured [if using flags — check plan]
- ✅ Monitoring/alerts set up [if needed]

**Documentation**:
- ✅ Deployment plan in specs/[feature]/plan.md
- ✅ Review completed and approved
- ✅ Rollback procedure documented (in plan or review)

[If any items fail:]
- ⚠️ **Not Ready**: [Explain what's missing in business terms]
- **Action needed**: [Specific fix required]

Stop if critical items fail. Proceed only when ready.

---

## Deployment Strategy

Explain the approach in plain English.

### 📦 Deployment Strategy

**Approach**: [Explain deployment method]

**Examples:**
- "I'll deploy this to all users immediately — low risk feature"
- "I'll use a feature flag to test with 10% of users first, then expand to everyone over 2 days"
- "I'll deploy during off-hours (2am) to minimize impact if anything goes wrong"

**Why this approach**: [Business reasoning]
**Estimated downtime**: [None / X minutes]
**Risk level**: [Low / Medium / High]

---

## Database Changes (if applicable)

From the plan, explain any database changes.

### 🗄️ Database Changes

**What's changing**: [Explain in business terms]

**Example:**
"We're adding a new table to store user preferences. This happens automatically when we deploy. No existing data is affected."

**Impact**:
- **User experience**: [No impact / Brief slowdown / etc.]
- **Data**: [No data loss / Creates new records / etc.]

**Reversible**: [Yes — can undo / No — permanent change]

---

## Feature Flag Setup (if applicable)

From the plan, document feature flag configuration.

### 🚩 Feature Flag Setup

**Flag name**: [flag-name]
**Initial state**: [OFF for everyone / ON for beta users / etc.]

**Rollout plan**:
- Day 1: Enable for 10 beta users
- Day 2: If no issues, expand to 10% of users
- Day 3: If no issues, enable for everyone

**Why phased rollout**: [Reduces risk, allows us to catch issues early]

**Manual override**: You can turn this off instantly if needed

---

## Execute Deployment

Guide the deployment. Run commands as appropriate (git merge, push, etc.). For CI/CD deployments, trigger the pipeline and monitor. Provide real-time updates.

### 🎯 Deploying Now...

[Provide updates as each step completes]

```
⏳ Merging branch to main...
✅ Branch merged successfully

⏳ Running database migrations... [if applicable]
✅ Database updated (took 15 seconds, no downtime)

⏳ Deploying code to production...
✅ Code deployed successfully

⏳ Running post-deployment health checks...
✅ All systems operational

🎉 Deployment Complete!
```

**Note**: Actual deployment steps depend on the project's setup (GitHub Actions, Vercel, Heroku, etc.). Run the appropriate commands. If deployment is manual, provide clear step-by-step instructions for the founder.

---

## Post-Deployment Verification

### ✅ Post-Deployment Checks

**Health Status**:
- ✅ Application is running
- ✅ Database is responding
- ✅ No error spikes in logs
- ✅ Key metrics are normal

**Feature Verification**:
- ✅ [Feature] is accessible
- ✅ [Core functionality] is working
- ✅ No user-reported issues

**Performance**:
- ✅ Response times normal
- ✅ No memory leaks detected
- ✅ Database performance stable

---

## Deployment Record

Create a comprehensive record. Save to `specs/[feature-slug]/deployment-[timestamp].md`.

### 📝 Deployment Record

**Feature**: [Feature Name]
**Deployed**: [Timestamp]
**Deployed by**: [Who triggered deployment]
**Git Commit**: [commit hash]
**Linear Ticket**: [link]
**Spec**: [link]
**Review**: [link]

### What Was Deployed

[Summary in business terms of what users can now do]

### Technical Changes

- **Files Modified**: [X files]
- **Database Changes**: [Yes/No — if yes, describe]
- **New Dependencies**: [Yes/No — if yes, list]
- **Configuration Changes**: [Yes/No — if yes, describe]

### Rollback Procedure

[Step-by-step instructions in plain English]

**Example:**
"If we need to undo this deployment:
1. Turn off feature flag '[flag-name]' (takes effect immediately)
2. Or revert to previous code version (takes 5 minutes)
3. Database changes are reversible — run rollback script if needed"

### Monitoring

**What to watch**:
- [Metric 1] (e.g., User login success rate — should stay above 95%)
- [Metric 2] (e.g., Error rate — should stay below 1%)
- [Metric 3] (e.g., Response time — should stay under 2 seconds)

**Where to check**:
- Dashboard: [link if applicable]
- Logs: [location]
- Alerts: [where alerts go]

### Success Metrics (from plan)

[Metrics defined in implementation plan]
**Target**: [What success looks like]
**How to measure**: [Where to check these metrics]
**When to check**: [Now / 24 hours / 1 week]

---

## Update Linear Ticket

Use Linear MCP (if available) to:

1. **Add comment** — "Deployed to production. See deployment record: [link to specs/[feature-slug]/deployment-[timestamp].md]"
2. **Update status** — Set to "Deployed" or "In Production"
3. **Add deployment timestamp** — In comment or custom field if available

If Linear MCP is not available, provide the comment text for the founder to add manually.

---

## Final Summary

### ✅ Deployment Summary

**Status**: [Successfully deployed / Deployed with monitoring / etc.]

**What's live**: [User-facing description of what changed]

**Monitoring period**: [How long to watch for issues]
"I'll monitor for the next 24 hours. If anything looks wrong, we can rollback immediately."

### What Users Will Notice

[Describe user experience changes]

**Example:**
"Users will now see a new 'Dashboard' tab in the navigation. When they click it, they'll see their recent activity and notifications."

### What Happens Next

[If phased rollout:]
- Day 1: Feature available to beta users
- Day 2: Expand to 10% if no issues
- Day 3: Full rollout if stable

[If immediate rollout:]
- Feature is live for all users now
- Monitoring for 24 hours
- Will alert you if any issues arise

### How to Verify It's Working

[Specific steps to test the feature in production]

**Example:**
"To test:
1. Log into the app
2. Click 'Dashboard' in navigation
3. You should see your activity feed
4. Try clicking on a notification — it should work"

### If Something Goes Wrong

[Clear rollback instructions]

"If users report issues:
1. Let me know immediately
2. I can turn off the feature flag in 30 seconds
3. Or we can rollback the entire deployment in 5 minutes
4. No data will be lost either way"

---

## Communication Rules

- **Business terms** — Explain deployment steps in plain English
- **Timeline** — Provide clear expectations (how long each step takes)
- **Rollback** — Make procedures crystal clear; founder should know exactly what to do
- **Risks** — Flag proactively before they become problems
- **Updates** — Keep founder informed throughout the process

---

## Good Deployment Communication ✅

- "Deploying now. This takes about 5 minutes. You might see a brief message saying 'Updating...' but users won't lose any work."
- "Feature is now live for 10 beta users. If they don't report any issues in 24 hours, we'll expand to everyone."
- "Database migration complete — added new table for user preferences. Took 15 seconds, zero downtime, all existing data safe."

---

## Bad Deployment Communication ❌

- "Running rake db:migrate on production"
- "Pushed to master and deployed via CI/CD pipeline"
- "ActiveRecord schema version updated to 20240214"

**Reframe in business terms:**
- "Updating the database with new user preference storage. Takes 15 seconds, no downtime."
- "Code is now live. The deployment system picked up the change automatically."
- "Database structure updated to support the new feature."

---

## Resolving Input

### From Linear ticket ID (e.g., ENG-123)

1. Find spec: specs/features/ENG-123-*.md
2. Derive feature slug
3. Find branch: eng-123-*
4. Find review: specs/[slug]/review-*.md

### From Spec filepath (e.g., specs/features/user-auth.md)

1. Feature slug: user-auth
2. Find branch: *-user-auth
3. Find review: specs/user-auth/review-*.md

### From Branch name (e.g., eng-123-user-auth)

1. Use branch directly
2. Extract slug from branch name
3. Find review: specs/[slug]/review-*.md

### If review not found

"No review found at specs/[feature-slug]/review-*.md. Run /review first to complete the code review before deploying."
