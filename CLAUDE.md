# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal finance / ledger dashboard: accounts, categorized transactions, budget caps, and receipt tracking. Built with SvelteKit 5 (runes), Tailwind v4, and Drizzle ORM over Turso (libSQL). Deployed on Vercel (project `ledger-app`, team `ammars-projects-3b535e02`).

## Commands

```sh
npm run dev            # start dev server
npm run build           # production build
npm run preview         # preview production build
npm run check            # svelte-kit sync + svelte-check (type checking — run after any change)
npm run check:watch

npm run db:generate     # generate a Drizzle migration from schema.ts
npm run db:push         # push schema directly to the Turso database (no migration file)
npm run db:migrate      # apply generated migrations
npm run db:studio       # Drizzle Studio
```

There is no test suite configured in this repo yet (no vitest/playwright). `npm run check` is the only automated correctness gate — always run it after editing `.ts`/`.svelte` files.

## Environment

Env vars come from Vercel, not a local `.env`:

```sh
vercel link              # one-time, links to ammars-projects-3b535e02/ledger-app
vercel env pull .env.local
```

Required: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (scoped to Development/Preview/Production on the dashboard). Also present: `BLOB_STORE_ID`, `BLOB_WEBHOOK_PUBLIC_KEY`, `VERCEL_OIDC_TOKEN` for Vercel Blob (receipt storage — not yet wired into the app). Both `drizzle.config.ts` and `src/lib/server/db/index.ts` throw immediately if the Turso vars are missing — check the error message rather than digging into a libsql connection failure.

Vercel Blob auth note: the SDK does not auto-read env vars in Vite/SvelteKit (only in Next.js) — `oidcToken`/`storeId` must be passed explicitly to `put`/`get`/`list`/`del` calls, sourced from `$env/static/private`.

Preview-only login route (`src/routes/api/preview-login`, see #37): lets automation/visual verification sign in without a GitHub OAuth round-trip, by authenticating a single throwaway seeded user (`preview-test@ledger.local`, own isolated accounts/categories, no real data) via Better Auth's email/password provider. Requires `PREVIEW_LOGIN_SECRET`, `PREVIEW_TEST_USER_EMAIL`, `PREVIEW_TEST_USER_PASSWORD` set on Vercel, scoped to **Preview only** — the route hard-rejects when `VERCEL_ENV === 'production'` regardless of the secret. `emailAndPassword` is enabled in `src/lib/server/auth.ts` for sign-in only (`disableSignUp: true`); no public sign-up endpoint is exposed in any environment.

## Architecture

**Current state**: the UI (`src/routes/+page.svelte` and `src/lib/components/*`) is fully built but still runs on static mock data from `src/lib/data.ts` / `src/lib/types.ts`, held in page-level `$state`. The Drizzle/Turso layer (`src/lib/server/db/`) exists but nothing in `src/routes` reads from it yet — wiring real data through `load` functions / form actions is the next major piece of work.

**Data layer** (`src/lib/server/db/`):
- `schema.ts` — Drizzle sqlite-core tables: `accounts`, `categories`, `transactions` (FKs to accounts/categories, `has_receipt` boolean for a future Blob URL link). All tables share a `timestamps` spread (`created_at`, `updated_at`); `updated_at` uses `.$onUpdate()` so it refreshes on every Drizzle `update()` call — this is a Drizzle runtime hook, not a DB trigger, so it only fires through Drizzle's query builder.
- `index.ts` — creates the libsql client + `drizzle()` instance, exported as `db`.
- `drizzle.config.ts` (repo root) drives `db:generate`/`db:push`/`db:migrate` against the `turso` dialect.

**UI layer**: single dashboard page composing components from `src/lib/components/` (Sidebar, DashboardHeader, KPICards, CategoryChart, BudgetHealth, TransactionTable, plus modals: AccountsModal, AddTransactionModal, PinModal). Components take data via props and communicate up through callback props (`onAdd`, `onRemove`, `onNav`, etc.) rather than dispatched events — follow this pattern for new components.

**Svelte 5 runes are forced project-wide** via `vite.config.ts` (`compilerOptions.runes: true` for all non-`node_modules` files) — always use `$state`/`$derived`/`$props`, not legacy reactive statements.

**Styling**: Tailwind v4, configured via `@theme` tokens in `src/routes/layout.css` (dark-mode palette: `--color-bg`, `--color-panel*`, `--color-ink`/`dim`/`subtle`/`muted`, `--color-accent*`, plus semantic `--color-green`/`red`/`amber`). Use these tokens (`text-ink`, `bg-panel`, etc.) instead of raw Tailwind colors.

**Path alias**: `$lib` → `src/lib` (SvelteKit convention, not custom-configured).

## Repo conventions

- **Issues/PRs**: work is tracked via GitHub issues, implemented on a feature branch, and shipped as a PR that closes the issue (`Closes #N`).
- **Commit messages** (enforced for the `@claude` GitHub Action in `.github/workflows/claude.yml`, and a good default here generally): imperative mood ("Add" not "Added"), no `feat:`/`fix:` prefixes, no trailing punctuation, single line, max ~72 chars. **Do not add `Co-Authored-By` or "Generated with Claude Code" attribution lines** — this repo explicitly opts out of that.
- The `claude.yml` workflow lets `@claude` be mentioned in issues/PR comments/reviews to trigger an automated agent run (also triggers on the `cc` label).
