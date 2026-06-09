/**
 * Verifies app user_id columns are TEXT and FK-aligned with Better Auth "user".id.
 * Fails fast if schema drifts back to UUID user_id columns.
 */

const REQUIRED_TEXT_USER_ID_COLUMNS = [
  { table: 'profiles', column: 'user_id' },
  { table: 'folders', column: 'user_id' },
  { table: 'files', column: 'user_id' },
]

export async function verifyUserIdSchema(client) {
  const violations = []

  for (const { table, column } of REQUIRED_TEXT_USER_ID_COLUMNS) {
    const result = await client.query(
      `SELECT data_type, udt_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = $1
         AND column_name = $2`,
      [table, column],
    )

    const row = result.rows[0]
    if (!row) {
      violations.push(`${table}.${column} is missing`)
      continue
    }

    if (row.data_type !== 'text' && row.udt_name !== 'text') {
      violations.push(
        `${table}.${column} must be TEXT (found ${row.data_type ?? row.udt_name})`,
      )
    }
  }

  const foreignKeys = await client.query(
    `SELECT
       tc.table_name,
       kcu.column_name,
       ccu.table_name AS foreign_table_name,
       ccu.column_name AS foreign_column_name
     FROM information_schema.table_constraints AS tc
     JOIN information_schema.key_column_usage AS kcu
       ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
     JOIN information_schema.constraint_column_usage AS ccu
       ON ccu.constraint_name = tc.constraint_name
       AND ccu.table_schema = tc.table_schema
     WHERE tc.constraint_type = 'FOREIGN KEY'
       AND tc.table_schema = 'public'
       AND kcu.column_name = 'user_id'
       AND tc.table_name IN ('profiles', 'folders', 'files')`,
  )

  const fkByTable = new Map(
    foreignKeys.rows.map((row) => [row.table_name, row]),
  )

  for (const { table } of REQUIRED_TEXT_USER_ID_COLUMNS) {
    const fk = fkByTable.get(table)
    if (!fk) {
      violations.push(`${table}.user_id is missing FK to "user"(id)`)
      continue
    }

    if (fk.foreign_table_name !== 'user' || fk.foreign_column_name !== 'id') {
      violations.push(
        `${table}.user_id FK must reference "user"(id), found ${fk.foreign_table_name}(${fk.foreign_column_name})`,
      )
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `User ID schema verification failed:\n${violations.map((item) => `- ${item}`).join('\n')}`,
    )
  }
}