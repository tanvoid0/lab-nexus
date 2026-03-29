# Lab Nexus — engineering plan

**Last updated:** 2026-03-29  

This file tracks **what shipped**, **work in progress**, and **intended future work**. For setup, env vars, and commands, use [`readme.md`](./readme.md).

---

## 1. Delivered (to date)

High-level themes; details stay in code and `readme.md`.

### Core product

| Area | Status |
|------|--------|
| Inventory CRUD, filters (category, location, condition, status), search (name, SKU, **track tag**) | Done |
| Asset detail: image, audit trail, edit/delete (RBAC) | Done |
| Check-out / check-in, expected return, quantity + **AssetUnit** when units exist | Done |
| Checkouts list (scoped by role), return flow | Done |
| Projects + **ProjectMember** (create project, add/remove by email) | Done |
| Admin dashboard: KPIs, overdue list, categories/locations mini-forms | Done |
| Spreadsheet import (heuristic mapping), inventory + **checkout CSV export** | Done |
| QR PNG API + `/scan/[tag]` (asset + unit tags) | Done |
| VCL branding (tokens, logo) | Done |

### Notifications & overdue

| Area | Status |
|------|--------|
| In-app notifications on overdue transition | Done |
| Mark read (per item + mark all), header unread badge | Done |
| Cron `GET /api/cron/overdue` + `CRON_SECRET` | Done |
| **Admin → Refresh overdue** (same job as cron; no GET mutation on admin load) | Done |
| Optional **Resend** email per borrower when marked overdue | Done |

### Ops, security, quality

| Area | Status |
|------|--------|
| Sign-in rate limit (in-memory, per IP) | Done |
| Cron route: burst limit + stricter limit on failed Bearer | Done |
| `GET /api/health` (liveness), `GET /api/health/ready` (Mongo ping) | Done |
| Security headers in `next.config.ts` | Done |
| Playwright smoke (`e2e/smoke.spec.ts`) + optional auth test (`e2e/auth-flow.spec.ts` + `E2E_*` env) | Done |
| GitHub Actions: lint + build on `main` / `master` | Done |
| Admin **Analytics** page (30-day checkouts, by category, top borrowers, by status) | Done |

---

## 2. Work in progress (WIP)

| Item | Owner / branch | Notes |
|------|----------------|-------|
| *— none tracked here —* | — | Update this table when you start a feature (e.g. `feat/oidc`). Remove rows when merged. |

*Convention:* keep WIP small—one row per active effort. Move completed rows to **§1** and shrink the diff in PR descriptions.

---

## 3. Future / backlog

Ordered roughly by impact vs. effort (adjust as the lab prioritizes).

### Near term (concrete, fits current stack)

- **Import UX**: column mapping preview, validation report, dry-run; document expected columns beside heuristic behavior.
- **E2E in CI**: MongoDB service container + seed + `pnpm test:e2e` (or nightly workflow) so smoke runs without a local machine.
- **Prisma**: address `package.json#prisma` deprecation when upgrading toward Prisma 7 (`prisma.config.ts`).
- **Overdue email**: digest one email per user per cron batch instead of N emails; respect a future `User.emailNotifications` (or similar) flag.

### Medium term (product + platform)

- **SSO / OIDC**: wire Auth.js provider; map IdP groups → `User.roles[]` via existing `mapExternalProfileToRoles` stub in `lib/auth/roles.ts`.
- **Multi-instance rate limiting**: Redis (or Upstash) backed limiter for login + cron; document stickiness if staying in-memory.
- **Deployment recipes**: Dockerfile + compose profile for `app + mongo`, or one-click notes for Vercel + Atlas + cron.
- **Deeper analytics**: date-range filters, export chart data CSV, checkout duration metrics.
- **Purchase invoices & procurement records**: attach acquisition evidence to inventory (e.g. vendor, invoice/PO number, date, amount, optional **PDF or file** in guarded storage). Model as `Asset` ↔ invoice (or line-item) relations; decide whether one invoice spans multiple assets vs. one asset multiple invoices over time. **RBAC**: admin/researcher create/edit; students read-only or none. Consider retention, PII on vendor docs, and export for audits alongside existing asset audit trail.
- **Multi-currency (procurement)**: lab/org **primary (functional) currency** as a setting. For each payment or invoice line, persist **what was actually charged**—amount + **transaction currency** (fixed at completion; legal/accounting truth). Separately persist **functional amount** in primary currency: either user-entered at booking time, or derived from an **FX rate + rate date + source** (manual table, finance export, or optional API—document that rates are indicative unless finance signs off). Do **not** rely on live conversion for stored totals; rollup reports and budgets use stored functional amounts. Revisit rounding, multi-line invoices in mixed currencies, and whether conversion is mandatory or optional per org.

### Longer term / nice to have

- **Self-service signup** (if policy allows) with admin approval queue.
- **Asset reservations** (hold before pickup) vs. immediate checkout.
- **Mobile-friendly** scan-first flows (PWA hints, larger tap targets on checkouts).
- **Audit**: export audit log CSV; retention policy notes for Mongo.

### Review later — RBAC & enterprise role management

*Deferred product/architecture notes; revisit when SSO, IT policy, or compliance pushes on identity.*

- **Current model:** Three fixed lab roles (`ADMIN`, `RESEARCHER`, `STUDENT`) on `User.roles[]` match most academic lab needs. `STUDENT` is already wired (seed user, checkout eligibility on asset detail, etc.). Optional developer experience only: a dev **Login as student** quick action (parity with admin/staff) if we want faster UX testing.
- **Custom in-app role creation** (admins defining arbitrary roles/permission matrices): generally **not** recommended for this product class—high cost (UI, auditing, tests). Prefer occasional new **named** roles enforced in code with `hasAnyRole` / `assertAnyRole`, plus **ProjectMember** for per-project membership.
- **Enterprise-style capabilities to reassess later:** OIDC/SAML and **group → `roles[]` mapping** (stub: `mapExternalProfileToRoles` in `lib/auth/roles.ts`), MFA/step-up via IdP, **admin UI** for role assignment (vs. DB/operations only), tight **audit** coverage for exports/imports/role changes, **resource-scoped** elevation (e.g. admin for a subset of locations/projects), **service/API** identities for integrations, access review / offboarding runbooks.
- **Key files:** `lib/auth/roles.ts`, `auth.ts`, Prisma `User`.

---

## 4. Out of scope (for now)

Explicit non-goals unless requirements change:

- Replacing MongoDB or Prisma without a migration project.
- Building a second client (native app) — web remains source of truth.
- Full ITSM / ticketing integration (Jira/ServiceNow) without a funded integration phase.

---

## 5. How to maintain this doc

1. After merging a feature: add a bullet to **§1** (or extend a table row) and remove any **§2** entry.
2. When planning: add/adjust **§3** items; break large items into checkboxes in the PR.
3. Keep **§2** honest—empty is fine.

---

## 6. Related files

| File | Role |
|------|------|
| [`readme.md`](./readme.md) | Setup, env, Mongo, cron, CI summary |
| [`.env.example`](./.env.example) | Variable templates |
| [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) | CI pipeline |
