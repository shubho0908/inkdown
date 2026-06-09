import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import pg from 'pg'

import { verifyUserIdSchema } from './lib/verify-user-id-schema.mjs'

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
  process.stderr.write('DATABASE_URL is required. Set it in .env.local or .env.\n')
  process.exit(1)
}

const neonDir = join(process.cwd(), 'scripts', 'neon')
const migrationFiles = readdirSync(neonDir)
  .filter((name) => /^\d+_.+\.sql$/.test(name))
  .sort()

if (migrationFiles.length === 0) {
  process.stderr.write('No SQL migrations found in scripts/neon/.\n')
  process.exit(1)
}

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
})

await client.connect()

for (const migrationFile of migrationFiles) {
  const schemaSql = readFileSync(join(neonDir, migrationFile), 'utf8')
  process.stdout.write(`Applying ${migrationFile}…\n`)
  await client.query(schemaSql)
}

await verifyUserIdSchema(client)

const tables = await client.query(
  "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
)

process.stdout.write(
  `Database schema ready (${tables.rows.map((row) => row.tablename).join(', ')})\n`,
)
process.stdout.write('User ID schema invariant verified (TEXT + FK -> "user".id)\n')

await client.end()