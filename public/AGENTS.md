# Inkdown

Inkdown is a self-hosted markdown workspace built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, Bun, Better Auth, Neon Postgres, and Cloudflare R2.

## Installation

```bash
cd inkdown
cp .env.example .env.local
bun install
bun run db:setup
bun run dev
```

## Configuration

Set these in `.env.local`:

```bash
NEXT_PUBLIC_APP_URL=https://inkdown.example.com
NEXT_PUBLIC_SITE_URL=https://inkdown.example.com
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=long-random-secret
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=inkdown-content
RESEND_API_KEY=re_...
RESEND_FROM="Inkdown <noreply@inkdown.example.com>"
CRON_SECRET=long-random-secret
```

## Usage

Run the development server:

```bash
bun run dev
```

Build and start for production:

```bash
bun run build
bun start
```

## Scripts

- `bun run lint` - run ESLint
- `bun run typecheck` - run TypeScript checks
- `bun run build` - build the Next.js app
- `bun run guard:api` - run API guardrails
- `bun run guard:react-doctor` - run React Doctor quality checks
- `bun run db:setup` - apply database migrations and seed metrics
