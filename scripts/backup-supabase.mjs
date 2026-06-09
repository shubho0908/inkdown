#!/usr/bin/env bun
/**
 * Full Supabase backup for Inkdown.
 *
 * Exports:
 * - pg_dump SQL (schema + data) when pg_dump is available
 * - Public tables as JSON via service-role REST
 * - Auth users via Admin API
 * - Backup manifest with row counts and file sizes
 */

import { createClient } from '@supabase/supabase-js'
import {
  mkdirSync,
  writeFileSync,
  statSync,
  existsSync,
  readFileSync,
} from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { writeLine } from './lib/cli.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

function loadEnvFile(path) {
  if (!existsSync(path)) return
  const text = readFileSync(path, 'utf8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq)
    let value = trimmed.slice(eq + 1)
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile(join(ROOT, '.env.local'))
loadEnvFile(join(ROOT, '.env'))

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const POSTGRES_HOST = process.env.POSTGRES_HOST
const POSTGRES_USER = process.env.POSTGRES_USER || 'postgres'
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD
const POSTGRES_DATABASE = process.env.POSTGRES_DATABASE || 'postgres'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
  process.exit(1)
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const backupDir = join(ROOT, 'backups', `supabase-${timestamp}`)
const jsonDir = join(backupDir, 'json')
const sqlDir = join(backupDir, 'sql')

mkdirSync(jsonDir, { recursive: true })
mkdirSync(sqlDir, { recursive: true })

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PUBLIC_TABLES = [
  'profiles',
  'folders',
  'files',
  'password_reset_tokens',
]

const PAGE_SIZE = 1000

function sha256File(path) {
  const data = readFileSync(path)
  return createHash('sha256').update(data).digest('hex')
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

async function fetchAllRows(table) {
  const rows = []
  let from = 0

  while (true) {
    const { data, error } = await admin
      .from(table)
      .select('*')
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      const message = error.message || ''
      const missingTable =
        message.includes('Could not find the table') ||
        message.includes('does not exist') ||
        error.code === 'PGRST205'

      if (missingTable) {
        return { rows: [], skipped: true, reason: message }
      }

      throw new Error(`Failed to export ${table}: ${message}`)
    }

    if (!data?.length) break
    rows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return { rows, skipped: false }
}

async function fetchAllAuthUsers() {
  const users = []
  let page = 1
  const perPage = 1000

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })

    if (error) {
      throw new Error(`Failed to export auth users: ${error.message}`)
    }

    const batch = data?.users ?? []
    users.push(...batch)
    if (batch.length < perPage) break
    page += 1
  }

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    phone: user.phone,
    email_confirmed_at: user.email_confirmed_at,
    phone_confirmed_at: user.phone_confirmed_at,
    confirmed_at: user.confirmed_at,
    last_sign_in_at: user.last_sign_in_at,
    created_at: user.created_at,
    updated_at: user.updated_at,
    is_anonymous: user.is_anonymous,
    app_metadata: user.app_metadata,
    user_metadata: user.user_metadata,
    identities: user.identities?.map((identity) => ({
      id: identity.id,
      provider: identity.provider,
      identity_data: identity.identity_data,
      created_at: identity.created_at,
      updated_at: identity.updated_at,
    })),
  }))
}

function findPgDump() {
  const candidates = [
    'pg_dump',
    '/opt/homebrew/opt/libpq/bin/pg_dump',
    '/usr/local/opt/libpq/bin/pg_dump',
    '/opt/homebrew/bin/pg_dump',
    '/usr/local/bin/pg_dump',
  ]

  for (const candidate of candidates) {
    const result = spawnSync(candidate, ['--version'], { encoding: 'utf8' })
    if (result.status === 0) return candidate
  }

  return null
}

function runPgDump(pgDumpPath) {
  if (!POSTGRES_HOST || !POSTGRES_PASSWORD) {
    return { ok: false, reason: 'Missing POSTGRES_HOST or POSTGRES_PASSWORD' }
  }

  const host = POSTGRES_HOST
  const outFile = join(sqlDir, 'full-database.dump.sql')

  const args = [
    '--host', host,
    '--port', '5432',
    '--username', POSTGRES_USER,
    '--dbname', POSTGRES_DATABASE,
    '--no-owner',
    '--no-privileges',
    '--format', 'plain',
    '--encoding', 'UTF8',
    '--file', outFile,
    '--schema', 'public',
    '--schema', 'auth',
  ]

  const result = spawnSync(pgDumpPath, args, {
    env: {
      ...process.env,
      PGPASSWORD: POSTGRES_PASSWORD,
    },
    encoding: 'utf8',
  })

  if (result.status !== 0) {
    return {
      ok: false,
      reason: result.stderr?.trim() || 'pg_dump failed',
    }
  }

  return { ok: true, path: outFile }
}

function runAuthUsersSqlDump(pgDumpPath) {
  if (!POSTGRES_HOST || !POSTGRES_PASSWORD) {
    return { ok: false, reason: 'Missing postgres credentials' }
  }

  const outFile = join(sqlDir, 'auth-users.dump.sql')
  const args = [
    '--host', POSTGRES_HOST,
    '--port', '5432',
    '--username', POSTGRES_USER,
    '--dbname', POSTGRES_DATABASE,
    '--no-owner',
    '--no-privileges',
    '--format', 'plain',
    '--encoding', 'UTF8',
    '--file', outFile,
    '--table', 'auth.users',
    '--table', 'auth.identities',
    '--table', 'auth.sessions',
    '--table', 'auth.refresh_tokens',
  ]

  const result = spawnSync(pgDumpPath, args, {
    env: { ...process.env, PGPASSWORD: POSTGRES_PASSWORD },
    encoding: 'utf8',
  })

  if (result.status !== 0) {
    return { ok: false, reason: result.stderr?.trim() || 'auth pg_dump failed' }
  }

  return { ok: true, path: outFile }
}

async function main() {
  writeLine(`Backup directory: ${backupDir}\n`)

  const manifest = {
    created_at: new Date().toISOString(),
    supabase_url: SUPABASE_URL,
    tables: {},
    auth_users: null,
    sql_dumps: {},
    files: [],
    warnings: [],
  }

  // 1. JSON exports via REST (service role bypasses RLS)
  for (const table of PUBLIC_TABLES) {
    process.stdout.write(`Exporting ${table}... `)
    const result = await fetchAllRows(table)

    if (result.skipped) {
      manifest.tables[table] = { rows: 0, skipped: true, reason: result.reason }
      manifest.warnings.push(`Table ${table} not present in database — skipped.`)
      writeLine('skipped (table not found)')
      continue
    }

    const { rows } = result
    const outPath = join(jsonDir, `${table}.json`)
    writeFileSync(outPath, JSON.stringify(rows, null, 2), 'utf8')
    const size = statSync(outPath).size
    manifest.tables[table] = { rows: rows.length, bytes: size }
    manifest.files.push({
      path: `json/${table}.json`,
      sha256: sha256File(outPath),
      bytes: size,
    })
    writeLine(`${rows.length} rows (${formatBytes(size)})`)
  }

  // 2. Auth users via Admin API
  process.stdout.write('Exporting auth users (Admin API)... ')
  const authUsers = await fetchAllAuthUsers()
  const authPath = join(jsonDir, 'auth_users.json')
  writeFileSync(authPath, JSON.stringify(authUsers, null, 2), 'utf8')
  const authSize = statSync(authPath).size
  manifest.auth_users = { rows: authUsers.length, bytes: authSize }
  manifest.files.push({
    path: 'json/auth_users.json',
    sha256: sha256File(authPath),
    bytes: authSize,
  })
  writeLine(`${authUsers.length} users (${formatBytes(authSize)})`)

  // 3. SQL dumps when pg_dump is available
  const pgDumpPath = findPgDump()
  if (pgDumpPath) {
    writeLine(`\nUsing pg_dump at ${pgDumpPath}`)

    process.stdout.write('Running full schema+data pg_dump (public + auth)... ')
    const fullDump = runPgDump(pgDumpPath)
    if (fullDump.ok) {
      const size = statSync(fullDump.path).size
      manifest.sql_dumps.full = { path: 'sql/full-database.dump.sql', bytes: size }
      manifest.files.push({
        path: 'sql/full-database.dump.sql',
        sha256: sha256File(fullDump.path),
        bytes: size,
      })
      writeLine(`ok (${formatBytes(size)})`)
    } else {
      manifest.warnings.push(`Full pg_dump failed: ${fullDump.reason}`)
      writeLine(`failed: ${fullDump.reason}`)
    }

    process.stdout.write('Running auth tables pg_dump... ')
    const authDump = runAuthUsersSqlDump(pgDumpPath)
    if (authDump.ok) {
      const size = statSync(authDump.path).size
      manifest.sql_dumps.auth = { path: 'sql/auth-users.dump.sql', bytes: size }
      manifest.files.push({
        path: 'sql/auth-users.dump.sql',
        sha256: sha256File(authDump.path),
        bytes: size,
      })
      writeLine(`ok (${formatBytes(size)})`)
    } else {
      manifest.warnings.push(`Auth pg_dump failed: ${authDump.reason}`)
      writeLine(`failed: ${authDump.reason}`)
    }
  } else {
    manifest.warnings.push(
      'pg_dump not found — JSON exports only. Install libpq for SQL dumps.',
    )
    writeLine('\npg_dump not found — skipped SQL dumps (JSON exports completed).')
  }

  // 4. Copy migration scripts into backup for schema reference
  const migrationsDir = join(backupDir, 'migrations')
  mkdirSync(migrationsDir, { recursive: true })
  const migrationFiles = [
    '001_create_tables.sql',
    '003_create_profiles.sql',
    '004_harden_auth_email_verification.sql',
    '005_add_public_folder_sharing.sql',
    '006_add_email_check_function.sql',
    '007_password_reset_tokens.sql',
  ]

  for (const file of migrationFiles) {
    const src = join(ROOT, 'scripts', file)
    if (!existsSync(src)) continue
    const dest = join(migrationsDir, file)
    writeFileSync(dest, readFileSync(src, 'utf8'), 'utf8')
    manifest.files.push({ path: `migrations/${file}`, note: 'schema reference copy' })
  }

  const manifestPath = join(backupDir, 'manifest.json')
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')

  writeLine('\n── Summary ──────────────────────────────')
  for (const [table, info] of Object.entries(manifest.tables)) {
    writeLine(`  ${table}: ${info.rows} rows`)
  }
  writeLine(`  auth_users: ${manifest.auth_users.rows} users`)
  if (manifest.sql_dumps.full) {
    writeLine(`  SQL dump: ${formatBytes(manifest.sql_dumps.full.bytes)}`)
  }
  if (manifest.warnings.length) {
    writeLine('\nWarnings:')
    for (const warning of manifest.warnings) {
      writeLine(`  - ${warning}`)
    }
  }
  writeLine(`\nBackup saved to:\n  ${backupDir}`)
  writeLine(`Manifest: ${manifestPath}`)
}

main().catch((error) => {
  console.error('\nBackup failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})