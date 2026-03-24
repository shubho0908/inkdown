import { spawnSync } from 'node:child_process'

const steps = [
  {
    name: 'Lint',
    command: 'pnpm',
    args: ['lint'],
  },
  {
    name: 'Type check',
    command: 'pnpm',
    args: ['exec', 'tsc', '--noEmit'],
  },
  {
    name: 'Build',
    command: 'pnpm',
    args: ['build'],
    env: {
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
]

for (const step of steps) {
  process.stdout.write(`\n==> ${step.name}\n`)

  const result = spawnSync(step.command, step.args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      ...step.env,
    },
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

process.stdout.write('\nLocal CI passed\n')
