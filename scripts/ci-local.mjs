import { spawnSync } from 'node:child_process'

const steps = [
  {
    name: 'Lint',
    command: 'bun',
    args: ['run', 'lint'],
  },
  {
    name: 'API guardrails',
    command: 'bun',
    args: ['scripts/check-api-guardrails.mjs'],
  },
  {
    name: 'Type check',
    command: 'bun',
    args: ['run', 'typecheck'],
  },
  {
    name: 'Build',
    command: 'bun',
    args: ['run', 'build'],
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
