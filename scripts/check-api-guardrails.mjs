import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const TARGETS = ['app', 'components', 'hooks', 'lib', 'proxy.ts']
const FILE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const FORBIDDEN_PATTERNS = [
  {
    label: 'custom X-Client-Token header gate',
    pattern: /x-client-token/i,
  },
  {
    label: 'legacy "Invalid client token" error contract',
    pattern: /Invalid client token/i,
  },
  {
    label: 'legacy client-token cookie contract',
    pattern: /client-token=/i,
  },
]

function shouldInspect(filePath) {
  return [...FILE_EXTENSIONS].some((extension) => filePath.endsWith(extension))
}

function walk(targetPath, results) {
  const absolutePath = join(ROOT, targetPath)
  const stats = statSync(absolutePath)

  if (stats.isDirectory()) {
    for (const entry of readdirSync(absolutePath)) {
      walk(join(targetPath, entry), results)
    }
    return
  }

  if (shouldInspect(targetPath)) {
    results.push(targetPath)
  }
}

const files = []
for (const target of TARGETS) {
  walk(target, files)
}

const violations = []
for (const file of files) {
  const content = readFileSync(join(ROOT, file), 'utf8')

  for (const rule of FORBIDDEN_PATTERNS) {
    if (rule.pattern.test(content)) {
      violations.push({
        file: relative(ROOT, join(ROOT, file)),
        label: rule.label,
      })
    }
  }
}

if (violations.length > 0) {
  console.error('API guardrail check failed. Remove brittle custom client-token enforcement:')
  for (const violation of violations) {
    console.error(`- ${violation.file}: ${violation.label}`)
  }
  process.exit(1)
}

process.stdout.write('API guardrail check passed\n')
