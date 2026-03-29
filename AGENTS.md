<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## UI / UX — icons

When adding or changing UI, **prefer icons for better UX** on navigation, actions, empty states, alerts, and important form areas. Use **Font Awesome** (`@fortawesome/react-fontawesome` + `@fortawesome/free-solid-svg-icons` / `free-regular-svg-icons`); root layout already loads `lib/fontawesome` and FA styles. In server components, wrap icons in a small client component where needed. See the repo-root Cursor rule `.cursor/rules/ui-icons-ux.mdc` for concise patterns.

## Engineering plan (`plan.md`)

Keep [`plan.md`](./plan.md) aligned with active work: move backlog (**§3**) or new efforts into **§2 WIP** while implementing, and log completions in **§1** when done. Follow `.cursor/rules/plan-md-maintenance.mdc`.

## Structure and modularity

Prefer **clear folders**, **small focused modules**, and **reusable atoms** (shared form pieces, pure `lib/` helpers, split admin/feature UI) over large monolithic files. See `.cursor/rules/code-organization.mdc` for concrete patterns and examples in this repo.

## Database and seed

When **new Prisma entities** are added or **existing models** are updated in ways that affect stored documents or seed expectations, **reseed from a clean database** on local dev: run **`pnpm db:reset`** (clear + `db push` + seed). Extend **`prisma/clear-database.ts`** for any new collections so wipes stay complete. See `.cursor/rules/database-seed-reset.mdc` for the full checklist and production guardrails.
