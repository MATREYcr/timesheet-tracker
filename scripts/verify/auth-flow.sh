#!/usr/bin/env bash
# Real-flow smoke check of authentication, driven by agent-browser against a running stack.
#
#   pnpm verify:auth                                   # local (http://localhost:3000)
#   BASE_URL=https://app.example.com \
#   API_URL=https://api.example.com pnpm verify:auth   # a deployed environment
#
# Registers a fresh user each run (unique email), so it is safe to repeat. Exits non-zero on the
# first failed step and always closes its isolated browser session.
# Requires the agent-browser CLI: npm i -g agent-browser && agent-browser install
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
BASE_URL="${BASE_URL%/}"
API_URL="${API_URL:-http://localhost:3333}"
API_URL="${API_URL%/}"
PASSWORD="${VERIFY_PASSWORD:-Verify1234!}"
EMAIL="verify-$(date +%s)-$RANDOM@example.com"
NAME="Verify Runner"
SESSION="auth-flow-$$"

command -v agent-browser >/dev/null || {
  echo "agent-browser not found. Install: npm i -g agent-browser && agent-browser install" >&2
  exit 2
}

ab() { agent-browser --session "$SESSION" "$@"; }
cleanup() { ab close >/dev/null 2>&1 || true; }
trap cleanup EXIT

STEP=0
step() {
  local name="$1"
  shift
  STEP=$((STEP + 1))
  printf '%2d. %s … ' "$STEP" "$name"
  local out
  if out=$("$@" 2>&1); then
    echo "ok"
  else
    echo "FAILED"
    echo "$out" | sed 's/^/    /' >&2
    echo "    url: $(ab get url 2>/dev/null || echo '?')" >&2
    exit 1
  fi
}

# Client-side navigations don't fire load events, so assert on location instead of waiting
# for network idle (which never settles against a dev server with HMR).
expect_path() { ab wait --fn "location.pathname === '$1'"; }
expect_text() { ab wait --text "$1"; }
expect_eval() { [ "$(ab eval "$1")" = "$2" ]; }
open_path() { ab open "$BASE_URL$1"; }

echo "Auth real-flow check → $BASE_URL (API $API_URL) as $EMAIL"

step "API rejects requests without a session (401)" \
  bash -c "[ \"\$(curl -s -o /dev/null -w '%{http_code}' '$API_URL/employees')\" = 401 ]"

step "signed-out visitor is sent to login" open_path /weekly-summary
step "  … with the requested path remembered" \
  expect_eval "location.pathname + location.search" '"/login?next=%2Fweekly-summary"'
step "  … and the login form is shown" expect_text "Welcome back"

step "open the register screen" open_path /register
step "  … form is shown" expect_text "Start tracking hours"
step "fill name" ab find label "Full name" fill "$NAME"
step "fill email" ab find label "Email" fill "$EMAIL"
step "fill password" ab find label "Password" fill "$PASSWORD"
step "submit registration" ab find role button click --name "Create account"
step "  … lands on the dashboard" expect_path /
step "  … dashboard renders" expect_text "Pending approvals"
step "  … signed-in user shown in the sidebar" expect_text "$EMAIL"

step "session cookie is not readable by page scripts" \
  expect_eval "document.cookie.includes('session_token')" "false"
step "browser session reaches the API (cookie + CORS)" \
  expect_eval "fetch('$API_URL/employees?pageSize=1', { credentials: 'include' }).then(r => r.status)" "200"

step "employees screen loads" open_path /employees
step "  … table controls render" expect_text "Show inactive"
step "time entries screen loads" open_path /time-entries
step "  … renders" expect_path /time-entries
step "weekly summary screen loads" open_path /weekly-summary
step "  … renders" expect_text "Weekly summary"

step "sign out" ab find role button click --name "Sign out"
step "  … back on login" expect_path /login
step "app is blocked again" open_path /employees
step "  … redirected to login" expect_path /login
step "  … API rejects the old session" \
  expect_eval "fetch('$API_URL/employees', { credentials: 'include' }).then(r => r.status)" "401"

step "fill email" ab find label "Email" fill "$EMAIL"
step "fill password" ab find label "Password" fill "$PASSWORD"
step "sign in" ab find role button click --name "Sign in"
step "  … returns to the remembered page" expect_path /employees
step "  … data loads" expect_text "Show inactive"

echo "All $STEP steps passed."
