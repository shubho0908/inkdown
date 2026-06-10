import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import pg from 'pg'
import { and, count, eq, isNotNull } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from '../lib/db/schema.ts'

function loadEnvFile(path) {
  try {
    const text = readFileSync(path, 'utf8')
    for (const line of text.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
        continue
      }

      const separatorIndex = trimmed.indexOf('=')
      const key = trimmed.slice(0, separatorIndex).trim()
      let value = trimmed.slice(separatorIndex + 1).trim()

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  } catch {
    // optional env file
  }
}

loadEnvFile(join(process.cwd(), '.env.local'))
loadEnvFile(join(process.cwd(), '.env'))

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  process.stderr.write('DATABASE_URL is required to seed platform metrics.\n')
  process.exit(1)
}

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
})

await client.connect()

const db = drizzle(client, { schema })
const snapshotId = 'global'

const existing = await db
  .select({ isReady: schema.platformMetrics.isReady })
  .from(schema.platformMetrics)
  .where(eq(schema.platformMetrics.id, snapshotId))
  .limit(1)

if (existing[0]?.isReady) {
  await client.end()
  process.exit(0)
}

const [totalUsersResult, totalDocumentsResult, totalFoldersResult, publicDocumentsResult] =
  await Promise.all([
    db.select({ value: count() }).from(schema.user),
    db.select({ value: count() }).from(schema.files),
    db.select({ value: count() }).from(schema.folders),
    db
      .select({ value: count() })
      .from(schema.files)
      .where(and(eq(schema.files.isPublic, true), isNotNull(schema.files.slug))),
  ])

const computedAt = new Date()

await db
  .insert(schema.platformMetrics)
  .values({
    id: snapshotId,
    totalUsers: totalUsersResult[0]?.value ?? 0,
    totalDocuments: totalDocumentsResult[0]?.value ?? 0,
    totalFolders: totalFoldersResult[0]?.value ?? 0,
    publicDocuments: publicDocumentsResult[0]?.value ?? 0,
    isReady: true,
    computedAt,
  })
  .onConflictDoUpdate({
    target: schema.platformMetrics.id,
    set: {
      totalUsers: totalUsersResult[0]?.value ?? 0,
      totalDocuments: totalDocumentsResult[0]?.value ?? 0,
      totalFolders: totalFoldersResult[0]?.value ?? 0,
      publicDocuments: publicDocumentsResult[0]?.value ?? 0,
      isReady: true,
      computedAt,
    },
  })

process.stdout.write('Seeded platform_metrics snapshot from existing data.\n')
await client.end()