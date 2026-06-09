import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

for (const typesPath of [
  join(process.cwd(), '.next', 'dev', 'types'),
  join(process.cwd(), '.next', 'types'),
]) {
  if (existsSync(typesPath)) {
    rmSync(typesPath, { recursive: true, force: true })
  }
}

const result = spawnSync('bun', ['x', 'tsc', '--noEmit'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

process.exit(result.status ?? 1)
