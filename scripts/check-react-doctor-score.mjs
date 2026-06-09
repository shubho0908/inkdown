import { spawnSync } from 'node:child_process'

const THRESHOLD = 100

const result = spawnSync(
  'bunx',
  ['react-doctor', '--json', '-y', '--fail-on', 'warning'],
  {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  },
)

if (result.error) {
  process.stderr.write(`React Doctor failed to run: ${result.error.message}\n`)
  process.exit(1)
}

let report

try {
  report = JSON.parse(result.stdout ?? '{}')
} catch {
  process.stderr.write('React Doctor returned invalid JSON.\n')
  if (result.stderr) {
    process.stderr.write(result.stderr)
  }
  process.exit(1)
}

if (!report.ok) {
  process.stderr.write(
    `React Doctor scan failed: ${report.error?.message ?? 'unknown error'}\n`,
  )
  process.exit(result.status ?? 1)
}

if (report.mode !== 'full') {
  process.stderr.write(
    `React Doctor must scan the full codebase (mode: ${String(report.mode)}). ` +
      'Diff-only scans are not allowed.\n',
  )
  process.exit(1)
}

if (report.diff != null) {
  process.stderr.write(
    `React Doctor diff mode is enabled (base: ${String(report.diff)}). ` +
      'Full-repository scans are required.\n',
  )
  process.exit(1)
}

const summary = report.summary ?? {}
const score = summary.score
const warningCount = summary.warningCount ?? 0
const errorCount = summary.errorCount ?? 0
const affectedFileCount = summary.affectedFileCount ?? 0

process.stdout.write(
  `React Doctor full-repo score: ${score ?? 'unavailable'} / ${THRESHOLD} ` +
    `(${summary.totalDiagnosticCount ?? 0} diagnostics across ${affectedFileCount} files)\n`,
)

if (!Number.isFinite(score)) {
  process.stderr.write(
    'React Doctor score unavailable. Ensure network access to the scoring API is available.\n',
  )
  process.stderr.write('Run: bunx react-doctor -y --verbose\n')
  process.exit(1)
}

if (errorCount > 0 || warningCount > 0) {
  process.stderr.write(
    `React Doctor found ${errorCount} error(s) and ${warningCount} warning(s) in the full codebase.\n`,
  )

  for (const diagnostic of report.diagnostics ?? []) {
    process.stderr.write(
      `  - ${diagnostic.filePath}:${diagnostic.line} [${diagnostic.severity}] ${diagnostic.rule}: ${diagnostic.message}\n`,
    )
  }

  process.stderr.write('Run: bunx react-doctor -y --verbose\n')
  process.exit(1)
}

if (score < THRESHOLD) {
  process.stderr.write(
    `React Doctor full-repo score ${score} is below ${THRESHOLD}. ` +
      'Run: bunx react-doctor -y --verbose\n',
  )
  process.exit(1)
}

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}