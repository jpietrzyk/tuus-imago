#!/usr/bin/env bash
set -euo pipefail

load_env_file() {
  local file_path="$1"

  if [[ -f "$file_path" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$file_path"
    set +a
  fi
}

# Allow local development workflows without manual export.
load_env_file ".env.local"
load_env_file ".env"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Primary path: the Supabase CLI (link + db push).
# Returns non-zero on failure so the caller can fall back.
cli_migrate() {
  if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" && "${SUPABASE_ACCESS_TOKEN}" != sbp_* ]]; then
    echo "SUPABASE_ACCESS_TOKEN must be a personal access token starting with sbp_." >&2
    echo "Do not use SUPABASE_SECRET_KEY / sb_secret_* as SUPABASE_ACCESS_TOKEN." >&2
    return 1
  fi

  if [[ -z "${SUPABASE_PROJECT_REF:-}" ]]; then
    echo "Missing SUPABASE_PROJECT_REF environment variable." >&2
    return 1
  fi

  if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
    echo "Missing SUPABASE_DB_PASSWORD environment variable." >&2
    return 1
  fi

  if [[ "${SUPABASE_DB_PASSWORD}" == sb_secret_* ]]; then
    echo "SUPABASE_DB_PASSWORD looks like a Supabase API key. Use your Postgres database password instead." >&2
    return 1
  fi

  pnpm dlx supabase link --project-ref "${SUPABASE_PROJECT_REF}" \
    && pnpm dlx supabase db push --linked --password "${SUPABASE_DB_PASSWORD}"
}

# Fallback path: apply pending migrations through the Supabase Management SQL API.
# Used when the CLI cannot link the project (known api-keys schema bug on typed keys).
management_api_migrate() {
  if [[ -z "${SUPABASE_PROJECT_REF:-}" ]]; then
    echo "Missing SUPABASE_PROJECT_REF environment variable." >&2
    return 1
  fi

  if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
    echo "Missing SUPABASE_ACCESS_TOKEN environment variable." >&2
    return 1
  fi

  node "${SCRIPT_DIR}/apply-migrations.mjs"
}

if cli_migrate; then
  echo "Migrations applied via Supabase CLI."
else
  echo "Supabase CLI migration failed; falling back to Management SQL API." >&2
  management_api_migrate
fi
