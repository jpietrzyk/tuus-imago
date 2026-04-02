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

if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" && "${SUPABASE_ACCESS_TOKEN}" != sbp_* ]]; then
  echo "SUPABASE_ACCESS_TOKEN must be a personal access token starting with sbp_."
  echo "Do not use SUPABASE_SECRET_KEY / sb_secret_* as SUPABASE_ACCESS_TOKEN."
  exit 1
fi

if [[ -z "${SUPABASE_PROJECT_REF:-}" ]]; then
  echo "Missing SUPABASE_PROJECT_REF environment variable."
  exit 1
fi

if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
  echo "Missing SUPABASE_DB_PASSWORD environment variable."
  exit 1
fi

if [[ "${SUPABASE_DB_PASSWORD}" == sb_secret_* ]]; then
  echo "SUPABASE_DB_PASSWORD looks like a Supabase API key. Use your Postgres database password instead."
  exit 1
fi

pnpm dlx supabase link --project-ref "${SUPABASE_PROJECT_REF}"
pnpm dlx supabase db push --linked --password "${SUPABASE_DB_PASSWORD}"
