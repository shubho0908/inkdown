#!/usr/bin/env bun
/**
 * One-time migration: Supabase backup -> Neon Postgres + Cloudflare R2 + Better Auth tables
 *
 * Usage:
 *   bun scripts/migrate-from-supabase.mjs --backup backups/supabase-<timestamp>
 *
 * Required env:
 *   DATABASE_URL
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 */

import { neon } from '@neondatabase/serverless'
import pg from 'pg'
import { writeLine } from './lib/cli.mjs'
import {
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'


const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

function loadEnvFile(path) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq)
    let value = trimmed.slice(eq + 1)
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile(join(ROOT, '.env.local'))
loadEnvFile(join(ROOT, '.env'))

function getArg(name) {
  const index = process.argv.indexOf(name)
  if (index === -1) return null
  return process.argv[index + 1] ?? null
}

function resolveBackupDir() {
  const explicit = getArg('--backup')
  if (explicit) return join(ROOT, explicit)

  const backupsRoot = join(ROOT, 'backups')
  if (!existsSync(backupsRoot)) {
    throw new Error('No backups/ directory found. Run bun run backup:supabase first.')
  }

  const candidates = readdirSync(backupsRoot)
    .filter((name) => name.startsWith('supabase-'))
    .map((name) => ({
      name,
      path: join(backupsRoot, name),
      mtime: statSync(join(backupsRoot, name)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime)

  if (!candidates.length) {
    throw new Error('No supabase backup folders found in backups/.')
  }

  return candidates[0].path
}

function getSql() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING
  if (!url) throw new Error('DATABASE_URL is required')
  return neon(url)
}

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET_NAME

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('R2 env vars are required for content migration')
  }

  return {
    bucket,
    client: new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    }),
  }
}

function buildFileContentKey(userId, fileId) {
  return `users/${userId}/files/${fileId}.md`
}

async function applySchema() {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required')
  }

  const schemaPath = join(ROOT, 'scripts/neon/001_schema.sql')
  const schemaSql = readFileSync(schemaPath, 'utf8')
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
  })

  await client.connect()
  await client.query(schemaSql)
  await client.end()
}

function parseAuthUsersDump(dumpPath) {
  const text = readFileSync(dumpPath, 'utf8')
  const lines = text.split('\n')
  const startIndex = lines.findIndex((line) => line.startsWith('COPY auth.users'))
  if (startIndex === -1) return []

  const users = []
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line === '\\.') break
    if (!line.trim()) continue

    const parts = line.split('\t')
    const id = parts[1]
    const email = parts[4]
    const encryptedPassword = parts[5] === '\\N' ? null : parts[5]
    const emailConfirmedAt = parts[6] === '\\N' ? null : parts[6]
    const createdAt = parts[20] === '\\N' ? new Date().toISOString() : parts[20]
    const updatedAt = parts[21] === '\\N' ? createdAt : parts[21]

    users.push({
      id,
      email,
      encryptedPassword,
      emailVerified: Boolean(emailConfirmedAt),
      emailVerifiedAt: emailConfirmedAt,
      createdAt,
      updatedAt,
    })
  }

  return users
}

async function migrateAuthUsers(sql, backupDir) {
  const dumpPath = join(backupDir, 'sql/auth-users.dump.sql')
  const users = parseAuthUsersDump(dumpPath)

  for (const user of users) {
    const name = user.email?.split('@')[0] || 'Inkdown user'

    await sql`
      INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
      VALUES (
        ${user.id},
        ${name},
        ${user.email},
        ${user.emailVerified},
        ${user.createdAt}::timestamptz,
        ${user.updatedAt}::timestamptz
      )
      ON CONFLICT (id) DO UPDATE
      SET
        email = EXCLUDED.email,
        email_verified = EXCLUDED.email_verified,
        updated_at = EXCLUDED.updated_at
    `

    if (user.encryptedPassword) {
      const accountId = `credential:${user.id}`
      await sql`
        INSERT INTO "account" (
          id, account_id, provider_id, user_id, password, created_at, updated_at
        )
        VALUES (
          ${accountId},
          ${user.id},
          'credential',
          ${user.id},
          ${user.encryptedPassword},
          ${user.createdAt}::timestamptz,
          ${user.updatedAt}::timestamptz
        )
        ON CONFLICT (id) DO UPDATE
        SET password = EXCLUDED.password, updated_at = EXCLUDED.updated_at
      `
    }
  }

  return users.length
}

async function migrateProfiles(sql, backupDir) {
  const profiles = JSON.parse(readFileSync(join(backupDir, 'json/profiles.json'), 'utf8'))

  for (const profile of profiles) {
    await sql`
      INSERT INTO profiles (user_id, username, email_verified, email_verified_at, created_at, updated_at)
      VALUES (
        ${profile.user_id},
        ${profile.username},
        ${profile.email_verified},
        ${profile.email_verified_at}::timestamptz,
        ${profile.created_at}::timestamptz,
        ${profile.updated_at}::timestamptz
      )
      ON CONFLICT (user_id) DO UPDATE
      SET
        username = EXCLUDED.username,
        email_verified = EXCLUDED.email_verified,
        email_verified_at = EXCLUDED.email_verified_at,
        updated_at = EXCLUDED.updated_at
    `
  }

  return profiles.length
}

function sortFoldersForMigration(folders) {
  const foldersByParentId = new Map()

  for (const folder of folders) {
    const parentKey = folder.parent_id ?? 'root'
    const siblings = foldersByParentId.get(parentKey) ?? []
    siblings.push(folder)
    foldersByParentId.set(parentKey, siblings)
  }

  const sortedFolders = []
  const queue = [...(foldersByParentId.get('root') ?? [])]

  while (queue.length > 0) {
    const folder = queue.shift()
    sortedFolders.push(folder)
    queue.push(...(foldersByParentId.get(folder.id) ?? []))
  }

  if (sortedFolders.length !== folders.length) {
    const migratedIds = new Set(sortedFolders.map((folder) => folder.id))

    for (const folder of folders) {
      if (!migratedIds.has(folder.id)) {
        sortedFolders.push(folder)
      }
    }
  }

  return sortedFolders
}

async function migrateFolders(sql, backupDir) {
  const folders = sortFoldersForMigration(
    JSON.parse(readFileSync(join(backupDir, 'json/folders.json'), 'utf8')),
  )

  for (const folder of folders) {
    await sql`
      INSERT INTO folders (
        id, user_id, name, parent_id, slug, is_public, created_at, updated_at
      )
      VALUES (
        ${folder.id}::uuid,
        ${folder.user_id},
        ${folder.name},
        ${folder.parent_id}::uuid,
        ${folder.slug},
        ${folder.is_public},
        ${folder.created_at}::timestamptz,
        ${folder.updated_at}::timestamptz
      )
      ON CONFLICT (id) DO UPDATE
      SET
        name = EXCLUDED.name,
        parent_id = EXCLUDED.parent_id,
        slug = EXCLUDED.slug,
        is_public = EXCLUDED.is_public,
        updated_at = EXCLUDED.updated_at
    `
  }

  return folders.length
}

async function uploadToR2(r2, userId, fileId, content) {
  const key = buildFileContentKey(userId, fileId)
  const body = Buffer.from(content ?? '', 'utf8')

  await r2.client.send(
    new PutObjectCommand({
      Bucket: r2.bucket,
      Key: key,
      Body: body,
      ContentType: 'text/markdown; charset=utf-8',
      ContentLength: body.byteLength,
    }),
  )

  return { key, size: body.byteLength }
}

async function migrateFiles(sql, backupDir, r2) {
  const files = JSON.parse(readFileSync(join(backupDir, 'json/files.json'), 'utf8'))
  const concurrency = 25
  let index = 0

  async function worker() {
    while (index < files.length) {
      const current = index
      index += 1
      const file = files[current]
      const { key, size } = await uploadToR2(r2, file.user_id, file.id, file.content)

      await sql`
        INSERT INTO files (
          id, user_id, folder_id, name, content_key, content_size, slug, is_public, created_at, updated_at
        )
        VALUES (
          ${file.id}::uuid,
          ${file.user_id},
          ${file.folder_id}::uuid,
          ${file.name},
          ${key},
          ${size},
          ${file.slug},
          ${file.is_public},
          ${file.created_at}::timestamptz,
          ${file.updated_at}::timestamptz
        )
        ON CONFLICT (id) DO UPDATE
        SET
          name = EXCLUDED.name,
          content_key = EXCLUDED.content_key,
          content_size = EXCLUDED.content_size,
          slug = EXCLUDED.slug,
          is_public = EXCLUDED.is_public,
          updated_at = EXCLUDED.updated_at
      `
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker))
  return files.length
}

async function main() {
  const backupDir = resolveBackupDir()
  const sql = getSql()
  const r2 = getR2Client()

  writeLine(`Migrating from backup: ${backupDir}\n`)

  process.stdout.write('Applying Neon schema... ')
  await applySchema()
  writeLine('done')

  process.stdout.write('Migrating auth users... ')
  const userCount = await migrateAuthUsers(sql, backupDir)
  writeLine(`${userCount} users`)

  process.stdout.write('Migrating profiles... ')
  const profileCount = await migrateProfiles(sql, backupDir)
  writeLine(`${profileCount} profiles`)

  process.stdout.write('Migrating folders... ')
  const folderCount = await migrateFolders(sql, backupDir)
  writeLine(`${folderCount} folders`)

  process.stdout.write('Migrating files to R2 + Neon metadata... ')
  const fileCount = await migrateFiles(sql, backupDir, r2)
  writeLine(`${fileCount} files`)

  const report = {
    migrated_at: new Date().toISOString(),
    backup_dir: backupDir,
    counts: { users: userCount, profiles: profileCount, folders: folderCount, files: fileCount },
  }

  const reportPath = join(backupDir, 'migration-report.json')
  writeReport(reportPath, report)

  writeLine('\nMigration complete.')
  writeLine(`Report: ${reportPath}`)
  writeLine(JSON.stringify(report.counts, null, 2))
}

function writeReport(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf8')
}

main().catch((error) => {
  console.error('\nMigration failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})