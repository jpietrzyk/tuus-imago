#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SUPABASE_PROJECT_REF:-}" ]]; then
  echo "Missing SUPABASE_PROJECT_REF environment variable."
  exit 1
fi

if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
  echo "Missing SUPABASE_DB_PASSWORD environment variable."
  exit 1
fi

pnpm dlx supabase link --project-ref "${SUPABASE_PROJECT_REF}"
pnpm dlx supabase db push --linked --password "${SUPABASE_DB_PASSWORD}"
