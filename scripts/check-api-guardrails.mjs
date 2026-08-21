import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const TARGETS = ['app', 'components', 'hooks', 'lib', 'proxy.ts']
const FILE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const SQL_GUARD_ALLOWED_PREFIXES = ['scripts/']

const SEARCH_PARAMS_GUARD_ALLOWED_PREFIXES = ['hooks/use-client-search-params.ts']

const SEARCH_PARAMS_FORBIDDEN_PATTERNS = [
  {
    label: 'direct useSearchParams import from next/navigation',
    pattern: /import\s*\{[^}]*\buseSearchParams\b[^}]*\}\s*from\s*['"]next\/navigation['"]/,
  },
  {
    label: 'destructured useSearchParams() result',
    pattern: /const\s*\{[^}]*\}\s*=\s*useSearchParams\s*\(/,
  },
  {
    label: 'destructured URLSearchParams methods',
    pattern:
      /const\s*\{[^}]*\b(get|has|getAll|entries|keys|values|forEach|toString)\b[^}]*\}\s*=\s*searchParams\b/,
  },
]

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

const SQL_FORBIDDEN_PATTERNS = [
  {
    label: 'raw Neon SQL tagged template',
    pattern: /\bsql`/,
  },
  {
    label: 'direct @neondatabase/serverless import',
    pattern: /from ['"]@neondatabase\/serverless['"]/,
  },
  {
    label: 'raw SQL client export',
    pattern: /export\s+(const|function)\s+sql\b/,
  },
]

const ZOD_GUARD_ALLOWED_PREFIXES = ['scripts/']

const BARREL_ALLOWED_PREFIXES = ['components/ui/']

const BARREL_REEXPORT_PATTERNS = [
  {
    label: 'barrel re-export (export * from)',
    pattern: /export\s+\*\s+from\s+['"]/,
  },
  {
    label: 'barrel re-export (export { ... } from)',
    pattern: /export\s+(?:type\s+)?\{[^}]+\}\s+from\s+['"]/,
  },
]

const BARREL_IMPORT_PATTERNS = [
  {
    label: 'barrel import from @/lib/auth (use @/lib/auth/<module> instead)',
    pattern: /from\s+['"]@\/lib\/auth['"]/,
  },
  {
    label: 'barrel import from @/lib/types (use @/lib/validation/models instead)',
    pattern: /from\s+['"]@\/lib\/types['"]/,
  },
  {
    label: 'barrel import from @/lib/validation (use @/lib/validation/<module> instead)',
    pattern: /from\s+['"]@\/lib\/validation(?:\/index)?['"]/,
  },
]

const USER_ID_GUARD_FILES = [
  'lib/db/schema.ts',
  'lib/validation/models.ts',
]

const USER_ID_FORBIDDEN_PATTERNS = [
  {
    label: 'UUID Better Auth user_id column in Drizzle schema',
    pattern: /uuid\s*\(\s*['"]user_id['"]\s*\)/,
  },
  {
    label: 'UUID Zod validation for API user_id field',
    pattern: /user_id:\s*uuidSchema\b/,
  },
]

const NEON_SQL_USER_ID_FORBIDDEN_PATTERNS = [
  {
    label: 'UUID user_id in Neon canonical schema',
    pattern: /\buser_id\s+UUID\b/i,
  },
]

const EMAIL_VERIFICATION_PATH_ALLOWED_FILES = new Set([
  'lib/auth/email-verification-flow.ts',
  'scripts/check-api-guardrails.mjs',
])

const EMAIL_VERIFICATION_PATH_FORBIDDEN_PATTERNS = [
  {
    label: 'hardcoded /auth/verify-email path (use EMAIL_VERIFICATION_GATE_PATH)',
    pattern: /['"`]\/auth\/verify-email['"`]/,
  },
  {
    label: 'hardcoded /auth/sign-up-success path (use LEGACY_SIGN_UP_SUCCESS_PATH)',
    pattern: /['"`]\/auth\/sign-up-success['"`]/,
  },
]

const BETTER_AUTH_CONFIG_FILE = 'lib/auth/better-auth.ts'

const BETTER_AUTH_REQUIRED_PATTERNS = [
  {
    label: 'requireEmailVerification: true',
    pattern: /requireEmailVerification:\s*true/,
  },
  {
    label: 'sendOnSignIn: false (verification emails must use server gate)',
    pattern: /sendOnSignIn:\s*false/,
  },
  {
    label: 'autoSignInAfterVerification: true',
    pattern: /autoSignInAfterVerification:\s*true/,
  },
  {
    label: 'sendOnSignUp: false (verification emails must use server gate)',
    pattern: /sendOnSignUp:\s*false/,
  },
  {
    label: 'authEmailGuardPlugin wired in Better Auth',
    pattern: /authEmailGuardPlugin\s*\(/,
  },
  {
    label: 'deliverAuthEmail used for auth email callbacks',
    pattern: /deliverAuthEmail\s*\(/,
  },
  {
    label: 'rateLimit.enabled: true',
    pattern: /rateLimit:\s*\{[\s\S]*?enabled:\s*true/,
  },
  {
    label: "rateLimit.storage: 'database'",
    pattern: /storage:\s*['"]database['"]/,
  },
  {
    label: 'rateLimit customRules for /send-verification-email',
    pattern: /['"]\/send-verification-email['"]:\s*\{/,
  },
  {
    label: 'rateLimit customRules for /request-password-reset',
    pattern: /['"]\/request-password-reset['"]:\s*\{/,
  },
]

const IN_MEMORY_RATE_LIMIT_FORBIDDEN_PREFIXES = ['app/api/']

const IN_MEMORY_RATE_LIMIT_ALLOWED_FILES = new Set(['proxy.ts'])

const IN_MEMORY_RATE_LIMIT_FORBIDDEN_PATTERNS = [
  {
    label: 'in-memory API rateLimitMap (use lib/rate-limit/consume or Better Auth database storage)',
    pattern: /rateLimitMap\s*=\s*new\s+Map/,
  },
]

const THEME_BROWSER_API_ALLOWED_FILES = new Set([
  'lib/theme-client.ts',
  'lib/theme-bootstrap.ts',
  'hooks/use-mobile.ts',
  'hooks/use-theme.ts',
  'components/dashboard-workspace.tsx',
])

const THEME_BROWSER_API_GUARD_PREFIXES = ['components/', 'hooks/', 'app/']

const THEME_BROWSER_FORBIDDEN_PATTERNS = [
  {
    label: 'direct window.localStorage (use @/lib/theme-client or @/hooks/use-theme)',
    pattern: /window\.localStorage/,
  },
  {
    label: 'direct prefers-color-scheme matchMedia (use @/lib/theme-client)',
    pattern: /window\.matchMedia\s*\(\s*['"]\(prefers-color-scheme/,
  },
  {
    label: 'direct document dark-class theme toggle (use applyThemeToDocument)',
    pattern: /document\.documentElement\.classList\.toggle\s*\(\s*['"]dark['"]/,
  },
  {
    label: 'useState lazy init with browser theme reader (use useTheme/useResolvedTheme)',
    pattern: /useState\s*<[^>]*>\s*\(\s*read(?:Stored|Resolved)?Theme/,
  },
  {
    label: 'legacy getStoredTheme helper (use readStoredTheme via useTheme)',
    pattern: /\bgetStoredTheme\b/,
  },
  {
    label: 'legacy readThemeState helper (use useTheme/useResolvedTheme)',
    pattern: /\breadThemeState\b/,
  },
  {
    label: 'theme-toggle bypassing use-theme hook (import @/hooks/use-theme only)',
    pattern: /from\s+['"]@\/lib\/theme-client['"]/,
    files: new Set(['components/theme-toggle.tsx']),
  },
  {
    label: 'theme-toggle useState theme state (use useThemeActions)',
    pattern: /\buseState\b/,
    files: new Set(['components/theme-toggle.tsx']),
  },
  {
    label: 'next/script in root layout (App Router beforeInteractive queues theme work after first paint)',
    pattern: /from\s+['"]next\/script['"]/,
    files: new Set(['app/layout.tsx']),
  },
]

const THEME_ARCHITECTURE_FILES = {
  themeToggle: 'components/theme-toggle.tsx',
  useThemeHook: 'hooks/use-theme.ts',
  themeSync: 'components/theme-sync.tsx',
  rootLayout: 'app/layout.tsx',
}

const THEME_ARCHITECTURE_REQUIRED_PATTERNS = [
  {
    file: THEME_ARCHITECTURE_FILES.themeToggle,
    label: 'theme-toggle must use useThemeActions from @/hooks/use-theme',
    pattern: /from\s+['"]@\/hooks\/use-theme['"]/,
  },
  {
    file: THEME_ARCHITECTURE_FILES.themeToggle,
    label: 'theme-toggle must call useThemeActions()',
    pattern: /\buseThemeActions\s*\(/,
  },
  {
    file: THEME_ARCHITECTURE_FILES.useThemeHook,
    label: 'use-theme must use useSyncExternalStore for SSR-safe snapshots',
    pattern: /useSyncExternalStore/,
  },
  {
    file: THEME_ARCHITECTURE_FILES.useThemeHook,
    label: 'use-theme must wire getServerThemeSnapshot server snapshot',
    pattern: /getServerThemeSnapshot/,
  },
  {
    file: THEME_ARCHITECTURE_FILES.useThemeHook,
    label: 'use-theme must wire getServerResolvedThemeSnapshot server snapshot',
    pattern: /getServerResolvedThemeSnapshot/,
  },
  {
    file: THEME_ARCHITECTURE_FILES.rootLayout,
    label: 'root layout must bootstrap theme before hydration (FOUC prevention)',
    pattern: /themeBootstrapScript/,
  },
  {
    file: THEME_ARCHITECTURE_FILES.rootLayout,
    label: 'root layout must run theme bootstrap as a native blocking script (next/script beforeInteractive queues after first paint)',
    pattern: /dangerouslySetInnerHTML=\{\{\s*__html:\s*themeBootstrapScript/,
  },
  {
    file: THEME_ARCHITECTURE_FILES.rootLayout,
    label: 'root layout must mark the theme bootstrap script blocking=render',
    pattern: /blocking=['"]render['"]/,
  },
  {
    file: THEME_ARCHITECTURE_FILES.rootLayout,
    label: 'root layout must include pre-CSS canvas styles for dark-mode first paint',
    pattern: /themeBootstrapStyle/,
  },
  {
    file: THEME_ARCHITECTURE_FILES.rootLayout,
    label: 'root layout must re-apply the document theme after hydration via ThemeSync',
    pattern: /<ThemeSync\s*\/>/,
  },
  {
    file: THEME_ARCHITECTURE_FILES.themeSync,
    label: 'theme-sync must re-apply theme in useLayoutEffect (before paint)',
    pattern: /useLayoutEffect/,
  },
  {
    file: THEME_ARCHITECTURE_FILES.themeSync,
    label: 'theme-sync must apply the stored theme to the document',
    pattern: /applyThemeToDocument\s*\(\s*readStoredTheme\s*\(\s*\)\s*\)/,
  },
]

const AUTH_EMAIL_FILE = 'lib/auth/email.ts'
const AUTH_EMAIL_TEMPLATE_FILE = 'lib/email/auth-email-template.tsx'

const AUTH_EMAIL_REQUIRED_PATTERNS = [
  {
    file: AUTH_EMAIL_FILE,
    label: 'auth emails must use AuthEmailTemplate',
    pattern: /AuthEmailTemplate/,
  },
  {
    file: AUTH_EMAIL_FILE,
    label: 'auth emails must render via @react-email/render',
    pattern: /@react-email\/render/,
  },
  {
    file: AUTH_EMAIL_FILE,
    label: 'auth emails must send rendered html to Resend',
    pattern: /\bhtml,\s*\n\s*text:/,
  },
  {
    file: AUTH_EMAIL_FILE,
    label: 'buildVerificationEmail must use confirmation template',
    pattern: /type:\s*['"]confirmation['"]/,
  },
  {
    file: AUTH_EMAIL_FILE,
    label: 'buildResetPasswordEmail must use password-reset template',
    pattern: /type:\s*['"]password-reset['"]/,
  },
  {
    file: AUTH_EMAIL_TEMPLATE_FILE,
    label: 'auth email template must use email-safe img element',
    pattern: /<img\b/,
  },
  {
    file: AUTH_EMAIL_FILE,
    label: 'auth emails must embed logo via CID attachment',
    pattern: /getAuthEmailLogoAttachment/,
  },
  {
    file: AUTH_EMAIL_FILE,
    label: 'auth emails must reference embedded logo cid src',
    pattern: /getAuthEmailLogoCidSrc/,
  },
  {
    file: 'lib/email/logo-attachment.ts',
    label: 'auth email logo attachment must use email-logo.png',
    pattern: /email-logo\.png/,
  },
]

const AUTH_EMAIL_FORBIDDEN_PATTERNS = [
  {
    file: AUTH_EMAIL_FILE,
    label: 'stub auth email HTML (use AuthEmailTemplate + @react-email/render)',
    pattern: /html:\s*`<p>/,
  },
  {
    file: AUTH_EMAIL_FILE,
    label: 'react-dom/server in auth email pipeline (use @react-email/render)',
    pattern: /react-dom\/server/,
  },
  {
    file: AUTH_EMAIL_FILE,
    label: 'Resend react payload without @react-email/render (render to html first)',
    pattern: /react:\s*input\.react/,
  },
  {
    file: AUTH_EMAIL_FILE,
    label: 'auth emails must pass templateProps (not pre-rendered html trees)',
    pattern: /templateProps:\s*input\.templateProps/,
  },
  {
    file: AUTH_EMAIL_TEMPLATE_FILE,
    label: 'next/image in auth emails (use img with cid or public PNG URL)',
    pattern: /from\s+['"]next\/image['"]/,
  },
  {
    file: AUTH_EMAIL_TEMPLATE_FILE,
    label: 'webp logo in auth emails (use public/email-logo.png)',
    pattern: /logo\.webp/,
  },
]

const CLIENT_COMPONENT_SERVER_AUTH_FORBIDDEN_PATTERNS = [
  {
    label: 'client component importing server auth route-utils (use @/lib/auth/safe-next-path)',
    pattern: /from\s+['"]@\/lib\/auth\/route-utils['"]/,
  },
  {
    label: 'client component importing server auth session',
    pattern: /from\s+['"]@\/lib\/auth\/session['"]/,
  },
  {
    label: 'client component importing server auth better-auth',
    pattern: /from\s+['"]@\/lib\/auth\/better-auth['"]/,
  },
  {
    label: 'client component importing server auth server helpers',
    pattern: /from\s+['"]@\/lib\/auth\/server['"]/,
  },
]

const EMAIL_VERIFICATION_FORBIDDEN_PATTERNS = [
  {
    label: 'client-side gate resend via authClient.sendVerificationEmail',
    pattern: /authClient\.sendVerificationEmail/,
  },
  {
    label: 'VERIFICATION_RESEND_SOURCE.LOGIN redirect (use GATE for server-controlled send)',
    pattern: /VERIFICATION_RESEND_SOURCE\.LOGIN/,
  },
  {
    label: 'VERIFICATION_RESEND_SOURCE.SIGNUP redirect (use GATE for server-controlled send)',
    pattern: /VERIFICATION_RESEND_SOURCE\.SIGNUP/,
  },
  {
    label: 'Better Auth sendOnSignIn background verification emails',
    pattern: /sendOnSignIn:\s*true/,
  },
  {
    label: 'Better Auth sendOnSignUp background verification emails',
    pattern: /sendOnSignUp:\s*true/,
  },
  {
    label: 'deprecated isEmailVerificationError helper',
    pattern: /\bisEmailVerificationError\b/,
  },
  {
    label: 'removed shouldClientResendVerificationEmail helper',
    pattern: /\bshouldClientResendVerificationEmail\b/,
  },
]

const ZOD_FORBIDDEN_PATTERNS = [
  {
    label: 'unvalidated fetchJson generic cast',
    pattern: /fetchJson\s*</,
  },
  {
    label: 'type-asserted request.json() body',
    pattern: /request\.json\(\)\)\s+as\s+/,
  },
  {
    label: 'type-annotated request.json() assignment',
    pattern: /:\s*[A-Z][A-Za-z0-9_]*\s*=\s*await\s+request\.json\(\)/,
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

function isSqlGuardAllowed(file) {
  return SQL_GUARD_ALLOWED_PREFIXES.some((prefix) => file.startsWith(prefix))
}

function isZodGuardAllowed(file) {
  return ZOD_GUARD_ALLOWED_PREFIXES.some((prefix) => file.startsWith(prefix))
}

function isBarrelGuardAllowed(file) {
  return BARREL_ALLOWED_PREFIXES.some((prefix) => file.startsWith(prefix))
}

function isSearchParamsGuardAllowed(file) {
  return SEARCH_PARAMS_GUARD_ALLOWED_PREFIXES.includes(file)
}

function isBarrelIndexFile(file) {
  return /(^|\/)index\.(?:t|j)sx?$/.test(file)
}

const violations = []
const searchParamsViolations = []
const userIdViolations = []
const sqlViolations = []
const zodViolations = []
const barrelViolations = []
const emailVerificationViolations = []
const themeBrowserViolations = []
const themeArchitectureViolations = []
const clientServerAuthViolations = []
const authEmailViolations = []
const rateLimitViolations = []

for (const file of files) {
  const content = readFileSync(join(ROOT, file), 'utf8')
  const relativeFile = relative(ROOT, join(ROOT, file))

  for (const rule of FORBIDDEN_PATTERNS) {
    if (rule.pattern.test(content)) {
      violations.push({
        file: relativeFile,
        label: rule.label,
      })
    }
  }

  if (!isSearchParamsGuardAllowed(relativeFile)) {
    for (const rule of SEARCH_PARAMS_FORBIDDEN_PATTERNS) {
      if (rule.pattern.test(content)) {
        searchParamsViolations.push({
          file: relativeFile,
          label: rule.label,
        })
      }
    }
  }

  if (!isSqlGuardAllowed(relativeFile) && relativeFile !== 'lib/db/client.ts') {
    for (const rule of SQL_FORBIDDEN_PATTERNS) {
      if (rule.pattern.test(content)) {
        sqlViolations.push({
          file: relativeFile,
          label: rule.label,
        })
      }
    }
  }

  if (
    !isZodGuardAllowed(relativeFile) &&
    (relativeFile.startsWith('app/api/') || relativeFile.startsWith('hooks/') || relativeFile.startsWith('components/'))
  ) {
    for (const rule of ZOD_FORBIDDEN_PATTERNS) {
      if (rule.pattern.test(content)) {
        zodViolations.push({
          file: relativeFile,
          label: rule.label,
        })
      }
    }
  }

  if (!EMAIL_VERIFICATION_PATH_ALLOWED_FILES.has(relativeFile)) {
    for (const rule of EMAIL_VERIFICATION_PATH_FORBIDDEN_PATTERNS) {
      if (rule.pattern.test(content)) {
        emailVerificationViolations.push({
          file: relativeFile,
          label: rule.label,
        })
      }
    }
  }

  for (const rule of EMAIL_VERIFICATION_FORBIDDEN_PATTERNS) {
    if (rule.pattern.test(content)) {
      emailVerificationViolations.push({
        file: relativeFile,
        label: rule.label,
      })
    }
  }

  if (
    !THEME_BROWSER_API_ALLOWED_FILES.has(relativeFile) &&
    THEME_BROWSER_API_GUARD_PREFIXES.some((prefix) => relativeFile.startsWith(prefix))
  ) {
    for (const rule of THEME_BROWSER_FORBIDDEN_PATTERNS) {
      if (rule.files && !rule.files.has(relativeFile)) {
        continue
      }

      if (rule.pattern.test(content)) {
        themeBrowserViolations.push({
          file: relativeFile,
          label: rule.label,
        })
      }
    }
  }

  const isClientComponent =
    relativeFile.startsWith('components/') ||
    relativeFile.startsWith('hooks/') ||
    relativeFile.startsWith('app/')
      ? /^['"]use client['"]/.test(content.trimStart())
      : false

  if (isClientComponent) {
    for (const rule of CLIENT_COMPONENT_SERVER_AUTH_FORBIDDEN_PATTERNS) {
      if (rule.pattern.test(content)) {
        clientServerAuthViolations.push({
          file: relativeFile,
          label: rule.label,
        })
      }
    }
  }

  if (
    IN_MEMORY_RATE_LIMIT_FORBIDDEN_PREFIXES.some((prefix) => relativeFile.startsWith(prefix)) &&
    !IN_MEMORY_RATE_LIMIT_ALLOWED_FILES.has(relativeFile)
  ) {
    for (const rule of IN_MEMORY_RATE_LIMIT_FORBIDDEN_PATTERNS) {
      if (rule.pattern.test(content)) {
        rateLimitViolations.push({
          file: relativeFile,
          label: rule.label,
        })
      }
    }
  }

  if (!isBarrelGuardAllowed(relativeFile)) {
    if (isBarrelIndexFile(relativeFile)) {
      barrelViolations.push({
        file: relativeFile,
        label: 'barrel index file (index.ts/tsx re-export entrypoints are not allowed)',
      })
    }

    for (const rule of BARREL_REEXPORT_PATTERNS) {
      if (rule.pattern.test(content)) {
        barrelViolations.push({
          file: relativeFile,
          label: rule.label,
        })
      }
    }

    for (const rule of BARREL_IMPORT_PATTERNS) {
      if (rule.pattern.test(content)) {
        barrelViolations.push({
          file: relativeFile,
          label: rule.label,
        })
      }
    }
  }
}

for (const guardedFile of USER_ID_GUARD_FILES) {
  const absolutePath = join(ROOT, guardedFile)
  if (!statSync(absolutePath).isFile()) {
    userIdViolations.push({
      file: guardedFile,
      label: 'missing guarded user_id schema file',
    })
    continue
  }

  const content = readFileSync(absolutePath, 'utf8')
  for (const rule of USER_ID_FORBIDDEN_PATTERNS) {
    if (rule.pattern.test(content)) {
      userIdViolations.push({
        file: guardedFile,
        label: rule.label,
      })
    }
  }
}

const neonDir = join(ROOT, 'scripts', 'neon')
for (const migrationFile of readdirSync(neonDir).filter((name) => name.endsWith('.sql'))) {
  const relativeFile = join('scripts', 'neon', migrationFile)
  const content = readFileSync(join(ROOT, relativeFile), 'utf8')
  for (const rule of NEON_SQL_USER_ID_FORBIDDEN_PATTERNS) {
    if (rule.pattern.test(content)) {
      userIdViolations.push({
        file: relativeFile,
        label: rule.label,
      })
    }
  }
}

const betterAuthConfigPath = join(ROOT, BETTER_AUTH_CONFIG_FILE)
if (statSync(betterAuthConfigPath).isFile()) {
  const betterAuthContent = readFileSync(betterAuthConfigPath, 'utf8')
  for (const rule of BETTER_AUTH_REQUIRED_PATTERNS) {
    if (!rule.pattern.test(betterAuthContent)) {
      emailVerificationViolations.push({
        file: BETTER_AUTH_CONFIG_FILE,
        label: `missing ${rule.label}`,
      })
    }
  }
} else {
  emailVerificationViolations.push({
    file: BETTER_AUTH_CONFIG_FILE,
    label: 'missing Better Auth config file',
  })
}

for (const rule of AUTH_EMAIL_REQUIRED_PATTERNS) {
  const absolutePath = join(ROOT, rule.file)
  if (!statSync(absolutePath).isFile()) {
    authEmailViolations.push({
      file: rule.file,
      label: `missing auth email file (${rule.label})`,
    })
    continue
  }

  const content = readFileSync(absolutePath, 'utf8')
  if (!rule.pattern.test(content)) {
    authEmailViolations.push({
      file: rule.file,
      label: rule.label,
    })
  }
}

for (const rule of AUTH_EMAIL_FORBIDDEN_PATTERNS) {
  const absolutePath = join(ROOT, rule.file)
  if (!statSync(absolutePath).isFile()) {
    authEmailViolations.push({
      file: rule.file,
      label: `missing auth email file (${rule.label})`,
    })
    continue
  }

  const content = readFileSync(absolutePath, 'utf8')
  if (rule.pattern.test(content)) {
    authEmailViolations.push({
      file: rule.file,
      label: rule.label,
    })
  }
}

for (const rule of THEME_ARCHITECTURE_REQUIRED_PATTERNS) {
  const absolutePath = join(ROOT, rule.file)
  if (!statSync(absolutePath).isFile()) {
    themeArchitectureViolations.push({
      file: rule.file,
      label: `missing theme architecture file (${rule.label})`,
    })
    continue
  }

  const content = readFileSync(absolutePath, 'utf8')
  if (!rule.pattern.test(content)) {
    themeArchitectureViolations.push({
      file: rule.file,
      label: rule.label,
    })
  }
}

if (violations.length > 0) {
  console.error('API guardrail check failed. Remove brittle custom client-token enforcement:')
  for (const violation of violations) {
    console.error(`- ${violation.file}: ${violation.label}`)
  }
  process.exit(1)
}

if (searchParamsViolations.length > 0) {
  console.error(
    'Search params guardrail check failed. Use @/hooks/use-client-search-params instead of destructuring URLSearchParams methods:',
  )
  for (const violation of searchParamsViolations) {
    console.error(`- ${violation.file}: ${violation.label}`)
  }
  process.exit(1)
}

if (userIdViolations.length > 0) {
  console.error(
    'User ID schema guardrail check failed. App user_id columns must stay TEXT and match Better Auth user.id:',
  )
  for (const violation of userIdViolations) {
    console.error(`- ${violation.file}: ${violation.label}`)
  }
  process.exit(1)
}

if (sqlViolations.length > 0) {
  console.error('SQL guardrail check failed. Use Drizzle ORM via lib/db instead of raw SQL:')
  for (const violation of sqlViolations) {
    console.error(`- ${violation.file}: ${violation.label}`)
  }
  process.exit(1)
}

if (zodViolations.length > 0) {
  console.error('Zod guardrail check failed. Validate API payloads and responses with Zod schemas:')
  for (const violation of zodViolations) {
    console.error(`- ${violation.file}: ${violation.label}`)
  }
  process.exit(1)
}

if (barrelViolations.length > 0) {
  console.error(
    'Barrel export guardrail check failed. Import concrete modules directly (shadcn ui/ is exempt):',
  )
  for (const violation of barrelViolations) {
    console.error(`- ${violation.file}: ${violation.label}`)
  }
  process.exit(1)
}

if (emailVerificationViolations.length > 0) {
  console.error(
    'Email verification guardrail check failed. Use lib/auth/email-verification-flow.ts and server-side gate resend:',
  )
  for (const violation of emailVerificationViolations) {
    console.error(`- ${violation.file}: ${violation.label}`)
  }
  process.exit(1)
}

if (themeBrowserViolations.length > 0) {
  console.error(
    'Theme browser API guardrail check failed. Use lib/theme-client.ts and hooks/use-theme.ts for SSR-safe theme access:',
  )
  for (const violation of themeBrowserViolations) {
    console.error(`- ${violation.file}: ${violation.label}`)
  }
  process.exit(1)
}

if (themeArchitectureViolations.length > 0) {
  console.error(
    'Theme architecture guardrail check failed. Keep SSR-safe theme layering (lib/theme → lib/theme-client → hooks/use-theme → components/theme-toggle):',
  )
  for (const violation of themeArchitectureViolations) {
    console.error(`- ${violation.file}: ${violation.label}`)
  }
  process.exit(1)
}

if (clientServerAuthViolations.length > 0) {
  console.error(
    'Client/server auth boundary check failed. Client components must not import server-only auth modules:',
  )
  for (const violation of clientServerAuthViolations) {
    console.error(`- ${violation.file}: ${violation.label}`)
  }
  process.exit(1)
}

if (authEmailViolations.length > 0) {
  console.error(
    'Auth email guardrail check failed. Use lib/email/auth-email-template with @react-email/render + Resend html/text:',
  )
  for (const violation of authEmailViolations) {
    console.error(`- ${violation.file}: ${violation.label}`)
  }
  process.exit(1)
}

if (rateLimitViolations.length > 0) {
  console.error(
    'Rate limit guardrail check failed. Use Postgres-backed lib/rate-limit/consume or Better Auth database rate limits:',
  )
  for (const violation of rateLimitViolations) {
    console.error(`- ${violation.file}: ${violation.label}`)
  }
  process.exit(1)
}

process.stdout.write('API guardrail check passed\n')
