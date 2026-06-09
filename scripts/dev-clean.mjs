import { spawnSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const PORT = process.env.PORT ?? '3000'

function killPort(port) {
  const result = spawnSync('lsof', ['-ti', `:${port}`], { encoding: 'utf8' })
  const pids = (result.stdout ?? '')
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean)

  for (const pid of pids) {
    spawnSync('kill', ['-9', pid])
  }

  if (pids.length > 0) {
    process.stdout.write(`Stopped process(es) on port ${port}: ${pids.join(', ')}\n`)
  }
}

rmSync(join(ROOT, '.next'), { recursive: true, force: true })
process.stdout.write('Removed .next build cache\n')

killPort(PORT)

const dev = spawnSync('bun', ['run', 'dev'], {
  cwd: ROOT,
  stdio: 'inherit',
  env: { ...process.env, PORT },
})

process.exit(dev.status ?? 1)