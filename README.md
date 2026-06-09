<p align="center">
  <picture>
    <source srcset="public/logo.webp" type="image/webp">
    <img src="public/logo.png" alt="Inkdown" width="80" height="80" style="">
  </picture>
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
  <img src="https://img.shields.io/badge/Neon-00E599?style=flat&logo=neon" alt="Neon">
  <img src="https://img.shields.io/badge/Cloudflare_R2-F38020?style=flat&logo=cloudflare" alt="R2">
  <img src="https://img.shields.io/badge/Better_Auth-000?style=flat" alt="Better Auth">
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
- **Backend**: Neon Postgres + Better Auth + Cloudflare R2, TanStack Query
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
- A [Neon](https://neon.com) Postgres database
- A [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket for markdown content
- SMTP credentials for auth emails (Resend, SendGrid, etc.)

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=long-random-secret
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=inkdown-content
SMTP_HOST=...
SMTP_USER=...
SMTP_PASSWORD=...
SMTP_FROM=Inkdown <noreply@inkdown.example.com>
NEXT_PUBLIC_APP_URL=https://inkdown.example.com
NEXT_PUBLIC_SITE_URL=https://inkdown.example.com
```

## Database Setup

For a **fresh** Neon database, apply the schema:

```bash
psql "$DATABASE_URL" -f scripts/neon/001_schema.sql
```

## Migrating from Supabase

If you have an existing Supabase backup:

```bash
# 1. Backup Supabase (if not done already)
bun run backup:supabase

# 2. Migrate to Neon + R2 (preserves user IDs, slugs, and markdown content)
bun run migrate:from-supabase -- --backup backups/supabase-<timestamp>
```

This imports auth users (with bcrypt password hashes), profiles, folders, file metadata into Neon, and uploads all markdown content to R2.

## Available Scripts

| Command                         | Description                  |
| ------------------------------- | ---------------------------- |
| `bun run dev`                   | Start development server     |
| `bun run build`                 | Production build             |
| `bun run start`                 | Start production server      |
| `bun run lint`                  | Run ESLint                   |
| `bun run typecheck`             | TypeScript type checking     |
| `bun run format`                | Format code with Prettier    |
| `bun run backup:supabase`       | Export Supabase data locally |
| `bun run migrate:from-supabase` | Import backup into Neon + R2 |

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

1. Apply `scripts/neon/001_schema.sql` to your Neon database (or run the migration script)
2. Configure SMTP for verification and password-reset emails
3. Set production environment variables on Vercel

## Architecture Notes

- **Neon Postgres** stores users (Better Auth), profiles, folders, and file metadata
- **Cloudflare R2** stores markdown content at `users/{userId}/files/{fileId}.md` (zero egress fees)
- **Better Auth** handles sign-up, sign-in, email verification, and password reset
- Email verification is enforced at both the application and profile level
- OG images are generated at runtime using `@vercel/og` (Satori) with the Geist font
- File sharing uses unique slugs; folders support recursive public browsing with file-level granularity
- The workspace cache layer uses TanStack Query with optimistic updates for a responsive drag-and-drop experience
