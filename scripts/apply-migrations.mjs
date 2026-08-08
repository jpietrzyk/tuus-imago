#!/usr/bin/env node
// Applies pending Supabase migrations via the Supabase Management SQL API.
//
// This is the fallback path for scripts/supabase-migrate.sh, used when the
// Supabase CLI cannot link a project. The CLI's `link` step fetches the
// project's API keys and validates them against a schema whose datetime regex
// only accepts a trailing `Z`; projects with typed API keys (publishable/
// secret) receive timestamps like `...+00:00`, which fail validation. This
// script bypasses `link` entirely by talking to the Management SQL endpoint.
//
// Required env: SUPABASE_PROJECT_REF, SUPABASE_ACCESS_TOKEN (personal access token).
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MIGRATIONS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "supabase",
  "migrations",
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const truncate = (s) => String(s).slice(0, 400);

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name} environment variable.`);
    process.exit(1);
  }
  return value;
}

const ref = requireEnv("SUPABASE_PROJECT_REF");
const token = requireEnv("SUPABASE_ACCESS_TOKEN");
const api = `https://api.supabase.com/v1/projects/${ref}/database/query`;

async function runQuery(query) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    let res;
    try {
      res = await fetch(api, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });
    } catch (err) {
      if (attempt < 5) {
        console.error(`  network error (attempt ${attempt}), retrying...`);
        await sleep(1500 * attempt);
        continue;
      }
      throw new Error(`Network error: ${truncate(err.message)}`);
    }

    const text = await res.text();

    if (res.status >= 500 && attempt < 5) {
      console.error(`  HTTP ${res.status} (attempt ${attempt}), retrying...`);
      await sleep(1500 * attempt);
      continue;
    }

    if (!res.ok) {
      throw new Error(`SQL query failed (HTTP ${res.status}): ${truncate(text)}`);
    }

    try {
      return text ? JSON.parse(text) : [];
    } catch {
      throw new Error(`Unexpected response (not JSON): ${truncate(text)}`);
    }
  }
}

function sqlLiteral(value) {
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function listMigrations() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => {
      const base = file.replace(/\.sql$/, "");
      const underscore = base.indexOf("_");
      const version = underscore === -1 ? base : base.slice(0, underscore);
      const name = underscore === -1 ? base : base.slice(underscore + 1);
      return {
        file,
        version,
        name,
        sql: readFileSync(join(MIGRATIONS_DIR, file), "utf8"),
      };
    });
}

async function getAppliedVersions() {
  // Bootstrap the tracking table if missing (matches the Supabase CLI schema).
  await runQuery(`
    create schema if not exists supabase_migrations;
    create table if not exists supabase_migrations.schema_migrations (
      version text primary key,
      statements text[],
      name text
    );
  `);
  const rows = await runQuery(
    "select version from supabase_migrations.schema_migrations;",
  );
  return new Set(rows.map((row) => row.version));
}

async function main() {
  const migrations = listMigrations();
  if (migrations.length === 0) {
    console.log("No migration files found in supabase/migrations.");
    return;
  }

  const applied = await getAppliedVersions();
  const pending = migrations.filter((m) => !applied.has(m.version));

  if (pending.length === 0) {
    console.log(
      `No pending migrations (${migrations.length} already applied).`,
    );
    return;
  }

  console.log(
    `Applying ${pending.length} pending migration(s) via Supabase Management SQL API...`,
  );

  for (const migration of pending) {
    process.stdout.write(`  ${migration.file} ... `);
    await runQuery(migration.sql);
    await runQuery(
      `insert into supabase_migrations.schema_migrations (version, name, statements) ` +
        `values (${sqlLiteral(migration.version)}, ${sqlLiteral(migration.name)}, ` +
        `ARRAY[${sqlLiteral(migration.sql)}]) on conflict (version) do nothing;`,
    );
    console.log("ok");
  }

  console.log(`Done. ${pending.length} migration(s) applied.`);
}

main().catch((err) => {
  console.error("\nMigration failed:", err.message || err);
  process.exit(1);
});
