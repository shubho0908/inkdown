import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const devTypesPath = join(process.cwd(), '.next', 'dev', 'types')

if (existsSync(devTypesPath)) {
  rmSync(devTypesPath, { recursive: true, force: true })
}

const result = spawnSync('bun', ['x', 'tsc', '--noEmit'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

process.exit(result.status ?? 1)
