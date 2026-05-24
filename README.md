<p align="center">
  <img src="public/favicon.png" alt="Inkdown" width="80" height="80" style="border-radius: 18px;">
</p>

<h1 align="center">Inkdown</h1>

<p align="center">
  <strong>Beautiful markdown workspace — create, organize, and share.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js" alt="Next.js 16">
  <img src="https://img.shields.io/badge/React-19-58c4dc?style=flat&logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat&logo=tailwindcss" alt="Tailwind CSS 4">
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=flat&logo=supabase" alt="Supabase">
</p>

---

## Overview

Inkdown is a private, full-featured markdown workspace that combines a rich editing experience with powerful organization and sharing capabilities. Built on modern web technologies, it provides a seamless writing environment with live preview, folder-based organization, and instant public sharing.

## Features

| Category         | Details                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Editor**       | Real-time markdown editing with live preview, toolbar, and keyboard shortcuts                                    |
| **Organization** | Hierarchical folder/file tree with drag-and-drop, rename, and move operations                                    |
| **Sharing**      | Public document sharing by slug, folder sharing with recursive browsing                                          |
| **Auth**         | Email sign-up/sign-in, email verification enforcement, forgot password flow with rate limiting & CSRF protection |
| **Theme**        | Light/dark mode with system preference detection                                                                 |
| **Workspace**    | Multi-file management, batch uploads (up to 500 files), markdown import                                          |
| **Export**       | Folder/workspace zip export with streaming                                                                       |

## Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, TypeScript, Tailwind CSS 4
- **Backend**: Supabase Auth + Postgres, TanStack Query
- **Tooling**: Bun, Husky, lint-staged

## Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Prerequisites

- Node.js 20+
- [Bun](https://bun.sh)
- A Supabase project

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional — recommended for production
NEXT_PUBLIC_APP_URL=https://inkdown.example.com
NEXT_PUBLIC_SITE_URL=https://inkdown.example.com

# Optional — local development redirects
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
```

## Database Setup

Run the SQL migration scripts in order via the Supabase SQL editor:

| Step | Script                                           | Purpose                |
| ---- | ------------------------------------------------ | ---------------------- |
| 1    | `scripts/001_create_tables.sql`                  | Core tables            |
| 2    | `scripts/003_create_profiles.sql`                | User profiles          |
| 3    | `scripts/004_harden_auth_email_verification.sql` | Security hardening     |
| 4    | `scripts/005_add_public_folder_sharing.sql`      | Folder sharing support |

> `scripts/002_create_folders.sql` is **not required** if you already ran `001`.

The folder sharing script (`005`) is additive and non-destructive:

- Existing folders are preserved with `is_public = false`
- Existing file share slugs are preserved
- `files.slug` is relaxed to nullable
- Runs in a transaction — safe to apply to an existing database

## Auth Configuration

In your Supabase dashboard:

1. **Site URL** → Set `Authentication > URL Configuration > Site URL` to your app domain
2. **Redirect URLs** → Add your callback URL
3. **Email template** → Update the confirm-signup template:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

With a post-confirm redirect:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/
```

## Available Scripts

| Command             | Description               |
| ------------------- | ------------------------- |
| `bun run dev`       | Start development server  |
| `bun run build`     | Production build          |
| `bun run start`     | Start production server   |
| `bun run lint`      | Run ESLint                |
| `bun run typecheck` | TypeScript type checking  |
| `bun run format`    | Format code with Prettier |
| `bun run ci:local`  | Full local quality checks |

## Project Structure

```
inkdown/
├── app/               Next.js routes, pages, API handlers, auth callbacks
├── components/        UI and feature components
├── hooks/             Client hooks (workspace, auth, queries)
├── lib/               Shared utilities, Supabase helpers, OG image generation
├── scripts/           SQL migrations and local CI runner
├── public/            Static assets (fonts, icons)
└── .husky/            Git hooks (lint-staged, typecheck, react-doctor)
```

## Deployment

Deploy Inkdown to any platform that supports Next.js (Vercel, Docker, self-hosted).

**Before deploying:**

1. Apply database migration scripts to your production Supabase project
2. Configure Supabase auth URLs and email templates
3. Set production environment variables

> `NEXT_PUBLIC_SUPABASE_ANON_KEY` is sufficient for public share lookups — RLS policies allow anon access on public endpoints. `SUPABASE_SERVICE_ROLE_KEY` is optional but can be provided for server-side operations.

## Architecture Notes

- The app relies on Supabase `auth.users` for identity and `public.profiles` for app-owned user metadata
- Email verification is enforced at both the application and database policy level
- OG images are generated at runtime using `@vercel/og` (Satori) with the Geist font
- File sharing uses unique slugs; folders support recursive public browsing with file-level granularity
- The workspace cache layer uses TanStack Query with optimistic updates for a responsive drag-and-drop experience


