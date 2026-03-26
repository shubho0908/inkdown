# Inkdown

Private markdown workspace with folders, sharing, and Supabase auth.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Auth + Postgres
- TanStack Query

## Features

- Markdown editing with live preview
- Folder and file management
- Public document sharing by slug
- Public folder sharing with recursive browsing
- Email sign-up and sign-in
- Email verification enforcement
- Light and dark theme support

## Requirements

- Node.js 20+
- pnpm
- A Supabase project

## Environment Variables

Create a `.env.local` file with:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Optional but recommended in production
NEXT_PUBLIC_APP_URL=https://inkdown.example.com
NEXT_PUBLIC_SITE_URL=https://inkdown.example.com

# Optional for local development redirects
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
```

## Database Setup

Run these SQL scripts in Supabase, in this order:

1. `scripts/001_create_tables.sql`
2. `scripts/003_create_profiles.sql`
3. `scripts/004_harden_auth_email_verification.sql`
4. `scripts/005_add_public_folder_sharing.sql`

`005_add_public_folder_sharing.sql` is additive and non-destructive:

- existing folders are preserved and start with `is_public = false`
- existing file share slugs are preserved
- `files.slug` is relaxed to nullable so private drafts can exist without forced share slugs
- the script runs in a transaction so it will roll back instead of leaving a partial schema change set

`scripts/002_create_folders.sql` is not required if you already ran `001`.

## Auth Configuration

In Supabase:

- Set `Authentication -> URL Configuration -> Site URL` to your app domain
- Add your callback URL to `Redirect URLs`
- Update the confirm-signup email template to use the server confirmation route:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

If you want a post-confirm redirect:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/
```

## Development

Install dependencies:

```bash
pnpm install
```

Start the app:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm ci:local
```

`pnpm ci:local` runs the local quality checks used for day-to-day validation.

## Project Layout

```text
app/           Next.js routes, pages, API handlers, auth callbacks
components/    UI and feature components
hooks/         Client hooks
lib/           Shared utilities and Supabase helpers
scripts/       SQL setup scripts and local CI runner
public/        Static assets
```

## Deployment

Deploy it anywhere that can run a Next.js app and provide the required environment variables.

Before deploying:

- apply the database scripts
- configure Supabase auth URLs and email template
- set production environment variables
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is enough for public share lookups because the public share RPCs and RLS policies allow anon access
- `SUPABASE_SERVICE_ROLE_KEY` is optional and can still be provided for server-side lookups

## Notes

- The app relies on Supabase `auth.users` for identity and `public.profiles` for app-owned user metadata.
- Email verification is enforced in both app logic and database policy.
