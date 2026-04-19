#!/usr/bin/env bash
# SEI-53: automated slice of PR readiness (build, lint, unit tests, architecture grep).
# 401 checks need a running dev server; see README "PR readiness checklist".

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== 1. ensure:build (lint + production build) =="
npm run ensure:build

echo ""
echo "== 2. unit tests (Vitest) =="
npm test

echo ""
echo "== 3. grep: app/ must not import @supabase/supabase-js for knowledge =="
if grep -rq "@supabase/supabase-js" app/ 2>/dev/null; then
  echo "FAIL: found @supabase/supabase-js under app/. Knowledge access must go through lib/knowledge/."
  exit 1
fi
echo "OK (no direct Supabase client imports in app/)"

echo ""
echo "== Automated checks passed. =="
echo "Next: start npm run dev and run the 401 curl checks in README (session + Custom LLM Bearer)."
