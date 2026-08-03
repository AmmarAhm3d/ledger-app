# GEMINI.md

This file provides guidance to Gemini / Antigravity when working with code in this repository.

## What this is

A personal finance / ledger dashboard featuring multi-account tracking, categorized transactions, monthly budget caps, receipt storage, and real-time aggregate analytics. 

Built with:
- **SvelteKit 5** (Svelte 5 Runes)
- **Tailwind CSS v4** (`@theme` tokens)
- **Drizzle ORM** over **Turso (libSQL)**
- **Better Auth** (session auth & route protection)
- **Vercel Blob** (receipt uploads)
- Deployed on **Vercel** (project `ledger-app`, team `ammars-projects-3b535e02`)

---

## Commands

```sh
npm run dev            # Start local dev server
npm run build          # Production build
npm run preview        # Preview production build
npm run check          # Run svelte-kit sync + svelte-check (always run after editing .ts/.svelte files)
npm run check:watch    # Watch mode for type checking

npm run db:generate    # Generate a Drizzle migration from schema.ts
npm run db:push        # Push schema directly to the Turso database (no migration file)
npm run db:migrate     # Apply generated migrations
npm run db:studio      # Start Drizzle Studio
```

`npm run check` is the primary automated type correctness gate — always verify with `npm run check` after modifying Svelte or TypeScript files.

---

## Environment

Environment variables come from Vercel:

```sh
vercel link              # Link local directory to ammars-projects-3b535e02/ledger-app
vercel env pull .env.local
```

Required variables:
- `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (Database connection)
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (Authentication)
- `BLOB_STORE_ID`, `BLOB_WEBHOOK_PUBLIC_KEY`, `VERCEL_OIDC_TOKEN` (Vercel Blob storage)

Both `drizzle.config.ts` and `src/lib/server/db/index.ts` throw immediately if Turso variables are missing.

> **Note on Vercel Blob auth**: In Vite/SvelteKit, the Vercel Blob SDK does not auto-detect environment variables. Pass `oidcToken` and `storeId` explicitly to `put` calls sourced from `$env/dynamic/private`.

---

## Architecture

### Data & Server Layer (`src/lib/server/`)
- `db/schema.ts` — Drizzle sqlite-core schema defining `accounts`, `categories`, `transactions`, and Better Auth models (`user`, `session`, `account`, `verification`). Shared `timestamps` helper adds `created_at` and `updated_at` (with `.$onUpdate()`).
- `db/index.ts` — Initializes the libSQL client and exports the `db` instance.
- `auth.ts` — Configures Better Auth with Drizzle adapter.
- `hooks.server.ts` — Handles session lookup and enforces route protection (redirecting unauthorized users to `/login`).
- `src/routes/+page.server.ts` — Handles database queries scoped to `locals.user.id` and SvelteKit form actions (`addAccount`, `removeAccount`, `updateAccountBalance`, `addCategory`, `updateCategory`, `removeCategory`, `addTransaction`).

### UI Layer (`src/routes/` & `src/lib/components/`)
- `src/routes/+page.svelte` — Main dashboard page displaying KPI cards, spending category chart, budget health, transaction table, and modal launchers.
- `src/lib/components/` — Modular components: `Sidebar`, `DashboardHeader`, `KPICards`, `CategoryChart`, `BudgetHealth`, `TransactionTable`, and modals (`AccountsModal`, `AddTransactionModal`, `CategoriesModal`, `PinModal`).
- `src/lib/pin-storage.ts` — Local storage state manager for masking sensitive account balance displays.

### Svelte 5 Runes
- Svelte 5 Runes are forced project-wide via `vite.config.ts` (`compilerOptions.runes: true`).
- Always use `$state`, `$derived`, `$props` (never legacy reactive statements like `$: ...`).

### Styling
- **Tailwind v4** configured via `@theme` tokens in `src/routes/layout.css` (dark-mode palette: `--color-bg`, `--color-panel*`, `--color-ink*`, `--color-accent*`, `--color-green`, `--color-red`, `--color-amber`).
- Use token utilities (`bg-panel`, `text-ink`, `border-panel-border`) instead of raw colors.

---

## Repo Conventions

- **Issue & PR Tracking**: Work is tracked via GitHub issues and shipped via PRs referencing the issue (`Closes #N`).
- **Commit Message Format**:
  - Imperative mood ("Add" not "Added", "Fix" not "Fixed").
  - No `feat:` or `fix:` prefixes.
  - No trailing punctuation.
  - Single line, max ~72 characters.
  - **Do NOT add `Co-Authored-By` or AI attribution lines.**
