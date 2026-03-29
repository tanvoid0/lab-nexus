# Lab Nexus — engineering plan

**Last updated:** 2026-03-29  

This file tracks **what shipped**, **work in progress**, and **intended future work**. For setup, env vars, and commands, use [`README.md`](./README.md).

---

## 1. Delivered (to date)

High-level themes; details stay in code and `README.md`.

### Core product

| Area | Status |
|------|--------|
| Inventory CRUD, filters (category, location, **assigned project**, condition code, operational status code), search (name, SKU, **track tag**); labels from **LookupEntry**; **optional columns** (incl. **Project**; client `localStorage`) + **copy view link** (current query string) on the list | Done |
| Asset detail: image, audit trail; **admin “delete” archives** the asset (soft `deletedAt`, SKU/track tag suffixed, units archived); lists/scan/export omit archived rows | Done |
| Check-out / check-in, expected return, quantity + **AssetUnit** when units exist; **purpose** on checkout / cart request is **optional** (still supported when provided) | Done |
| **Borrow cart** (`/cart`): `CartProvider` + **`UserCart`** (DB JSON lines + default project, debounced `syncUserCartAction`; cleared after successful cart submit); **CheckoutRequest** + **CheckoutRequestLine** (see **`prisma/schema.prisma`**, **`prisma/clear-database.ts`**); **STUDENT** → staff approval; **RESEARCHER** / **ADMIN** auto-create **Checkout**; default + per-line **Project**; tracking **`/requests`** & **`/requests/[id]`**; **Admin → Loan approvals** (`/admin/checkout-requests`, toolbar + client queue actions); **shell nav Cart** (badge) + home **dashboard** shortcuts; inventory + project tables + asset detail **Add to cart**; **`lib/checkout/create-single-checkout.ts`**, **`lib/checkout/validate-cart-lines.ts`**; audit **`CheckoutRequest`** entity (**§1** Lending flow filter) | Done |
| Checkouts list (scoped by role), return flow | Done |
| Projects + **ProjectMember** (create project, add/remove by email); **project profile** (description, web links, document URLs — stored as JSON, validated URLs); **Asset.projectId** allocation; project detail shows **assigned inventory** + link to inventory filtered by project; inventory **CSV export** includes project name | Done |
| Admin dashboard: KPIs, overdue list; **Lab accounts** (`/admin/users`, ADMIN toolbar): deactivate/restore users via **`User.deletedAt`** (no hard delete; sign-in blocked for deactivated); audit **User** entity + **Accounts** flow filter | Done |
| **Lab currencies** (`/settings/currencies`, ADMIN; entry from **Settings**): singleton `LabCurrencyConfig` — **functional (base)** ISO 4217 currency + **additional transaction** codes; `getCachedLabCurrencyConfig()`, `isAllowedTransactionCurrency()`, `formatMonetaryAmount()` in `lib/currency/` for procurement integration; optional `LAB_FUNCTIONAL_CURRENCY` bootstrap; `/admin/currency` redirects | Done |
| **Reference data** (`/admin/reference-data`, ADMIN): categories/locations/lookup **archive** on delete (soft `deletedAt`, unique name/code suffixed); active-only rows in pickers and lookup validation | Done |
| Spreadsheet import (heuristic mapping), **Preview import** dry-run (row-level outcomes, no writes), column-alias docs on `/admin/import`; inventory + **checkout CSV export** | Done |
| **Reusable QR + scan primitives** (`lib/qr/*`: PNG buffer, `/api/qr` href, `absoluteUrlForAppPath`; `lib/scan/*`: path-segment decoding, `resolveInventoryTrackTagScan`) + **`/scan/[...tag]`** inventory track tags (asset + unit); unit tags redirect with **`?unit=`** when unique; asset detail **Scan &amp; QR** shows one QR with a **scan-target** dropdown when multiple distinct tags exist (`lib/inventory/scan-qr-choices.ts`) | Done |
| VCL branding & app chrome (tokens, logo, shell; desktop sticky bar: breadcrumbs, theme cycle, account menu) | Done |

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
| **Lab AI assistant** (optional): `lib/ai/*`, `POST /api/ai/chat`, **Gemini** via `@google/generative-ai`; read-only **tool registry** (inventory search, track-tag resolve, **my** checkouts, reference labels; **recent audit** for **ADMIN** only); toolbar **Lab assistant** for all **lab roles** when `GEMINI_API_KEY` is set and `AI_ASSISTANT_ENABLED` is not `false`; per-user + per-IP rate limits on chat | Done |
| Cron route: burst limit + stricter limit on failed Bearer | Done |
| `GET /api/health` (liveness + `assistant.active` / `assistant.configured`), `GET /api/health/ready` (Mongo ping + same assistant flags); per‑IP rate limits on health/QR/assistant/dev seed/AI pre‑auth (`lib/api/rate-limit-http.ts`) | Done |
| Security headers in `next.config.ts` | Done |
| **Docker Compose**: `docker-compose.yml` (Mongo + named volume); **`docker compose --profile full`** builds/runs **`Dockerfile`** (Next **standalone**), injects **`.env`** (`env_file`), overrides **`DATABASE_URL`** to **`mongo`**; **`mongo-init`** + gated **`seed`** (`prisma/seed-gate.ts`) + **`app`** — see **README** (Docker-first setup) | Done |
| Playwright smoke (`e2e/smoke.spec.ts`) + optional auth test (`e2e/auth-flow.spec.ts` + `E2E_*` env); run locally (`pnpm dev` + Mongo + seed) | Done |
| Admin **Analytics** page (30-day checkouts, by category, top borrowers, by status); charts via **Recharts** (bar, donut, pie, horizontal bar) themed from CSS variables; **Dashboard** (ADMIN/RESEARCHER) embeds checkout **status donut** + **7-day checkout bar** with link to full analytics; pie/legend layout avoids overlapping labels | Done |
| **Prisma CLI**: `prisma.config.ts` for seed (no deprecated `package.json#prisma`); `import "dotenv/config"` so `DATABASE_URL` resolves when the CLI skips auto `.env` | Done |
| **Public-clone hygiene**: `.gitignore` allows committing `.env.example` while ignoring `.env`; seed upserts **synthetic** bulk inventory (richer categories/locations, **condition / operational status** mix, **42** default rows unless `INVENTORY_SEED_ITEM_COUNT` / JSON file) unless `prisma/data/inventory-seed.json` / `INVENTORY_SEED_JSON` is provided; **second demo project** (profile fields) + optional **pending checkout request** when `SYN-INV-*` rows exist; first local seed can persist a **random** demo password to gitignored `prisma/.seed-demo-credentials.json` (set `SEED_DEMO_PASSWORD` when you need a known value, e.g. for E2E) | Done |
| **Modular UI / lib**: shared `components/form/field-error`, `lib/reference/merge-lookup-options`, `lib/audit/entity-href`, `actionFailureMessage()` in `lib/form/action-result`; admin **audit trail** split into `audit-trail-filters` / `audit-trail-table` (barrel `audit-trail.tsx`); **reference data** under `components/admin/reference-data/` with barrel import | Done |

---

## 2. Work in progress (WIP)

| Item | Owner / branch | Notes |
|------|----------------|-------|
| *— none tracked here —* | — | Update this table when you start a feature (e.g. `feat/oidc`). Remove rows when merged. |

*Convention:* keep WIP small—one row per active effort. Move completed rows to **§1** and shrink the diff in PR descriptions.

---

## 3. Future / backlog

Ordered roughly by impact vs. effort (adjust as the lab prioritizes).

### Product decisions (reference)

- **Checkout status** (`ACTIVE`, `RETURNED`, `OVERDUE`) is **not** admin-maintainable taxonomy: it is **workflow state** enforced by lending and overdue jobs. Asset **operational status** (available / maintenance / retired) is separate and **is** admin-configurable via lookup entries.

### UX & interaction (strategy)

Ship a **simple default path** (clear labels, obvious next steps, strong empty states and feedback) while letting power users go deeper **without** cluttering primary screens.

- **Progressive disclosure:** put infrequent or technical choices behind **Settings**, **More options**, **Advanced** collapsibles, or secondary routes—not on every form or list by default.
- **Preference tiers:** **Client-only** prefs (e.g. theme, density, optional column layouts) via `localStorage` or similar for zero-friction customisation; **Server-backed** prefs (e.g. notification email toggles, org/lab policy) on `User` or org settings when persistence and RBAC matter.
- **Interaction:** keep loading/success/error feedback consistent (e.g. toasts); prefer one primary action per empty state; confirm only for destructive or irreversible actions.
- **What to avoid:** exposing every knob on main workflows; **custom in-app permission matrices** (see **Review later — RBAC & enterprise role management** below—prefer named roles in code plus IdP group mapping when enterprise complexity appears).

Concrete backlog items below (import UX, mobile scan-first, **QR batch/group labeling**, notification prefs) align with this strategy.

### Access control & privileges (planned — design choice)

**Goal:** let the lab adjust *who can do what* without rewriting the app for every policy tweak, **without** building a full ITSM-style permission matrix in the database.

| Approach | Fit for Lab Nexus | Notes |
|----------|-------------------|--------|
| **Named roles only** (`User.roles[]` — extend with e.g. `LAB_MANAGER` when needed) | **Best default** | Roles are **defined in code** (`lib/auth/roles.ts`, `hasRole` / `hasAnyRole` / `assertAnyRole` on every server action + API route). **Admin UI** only **assigns** roles from a **fixed catalog** (dropdown/checklist). Cheap to audit and test. |
| **Capability bundles (optional add-on)** | Good when 3–4 roles are too coarse | Add a **closed list** of strings, e.g. `inventory:mutate`, `reference:write`, `export:data`, stored on `User` or derived from role in code. UI toggles **only** those predefined capabilities; enforcement still **maps capabilities → checks in TypeScript** (single source of truth). Not a free-form “entity × action” grid. |
| **Arbitrary groups / matrix in UI** | **Not recommended** here | Admins defining new permission types or per-entity rules in the DB drives **large UI, migrations, auditing, and security review** cost; same concerns called out in **Review later — RBAC** below. |

**Recommended path:** (1) **Admin → Users** (or similar): assign **roles** from the fixed list; (2) add **new named roles** in code when policy needs a new band; (3) introduce **capabilities** only if two labs need different mixes that roles cannot express cleanly—keep the capability enum in code and mirror IdP groups via `mapExternalProfileToRoles` when SSO lands.

### Approval flows (plan — discovery, not committed)

**Intent:** capture how *approvals* *could* work before we know which actions need them. Nothing here is a promise to build; it is a place to converge on **which workflows** warrant human or policy gates, and **how** configurable they should be.

**Why consider it at all:** some labs want accountability (who authorized a checkout, import, or spend) without slowing every click. Others are fine with **RBAC-only** (role already implies trust). The product should eventually support **optional** approval layers where policy demands them, defaulting to today’s simple model.

#### Candidate surfaces (prioritize later)

These are *hypotheses*—validate with real lab policy before designing schema or UI.

| Surface | Why approval might matter | Current / nearby behavior |
|--------|---------------------------|---------------------------|
| **Self-service signup** | Gate who gets an account | Already listed under **Longer term**; natural fit for a queue |
| **Bulk import (apply)** | Prevent bad or malicious mass changes | Import UX backlog (preview/dry-run); approval could sit *after* dry-run |
| **Checkout** (selected assets, long duration, or “restricted” category) | High-value or sensitive gear | **Shipped:** **borrow cart** + **CheckoutRequest** for **STUDENT** (staff queue **`/admin/checkout-requests`**); instant checkout for **RESEARCHER**/**ADMIN** — see **§1**. **Still backlog / policy:** category or duration gates, approver notifications, org-wide toggles (env or future **LabSettings**). |
| **Reservations / holds** | Competing demand for scarce items | Backlog item; approval could resolve conflicts |
| **Asset lifecycle** (create, retire, delete) | Irreversible or audit-sensitive | Today: RBAC; optional **second pair of eyes** for delete/retire |
| **Procurement / invoices** | Financial evidence | Medium-term backlog; finance may want sign-off on amounts or attachments |
| **Project membership / invites** | Access to project-scoped resources | Today: admin/researcher adds members; could add **invite + accept** or **PI approves** |

*Student **borrow-cart** submissions already use **CheckoutRequest** + **Loan approvals** (see **§1**). Other rows in the table remain future unless shipped there; a generic cross-cutting “approval engine” is still optional.*

#### Policy mechanisms (mix and match per workflow)

When a surface *does* need gating, these are the levers—often combined:

- **Org / lab settings (server-backed):** master toggles (“require approval for student checkouts over N days”), approver roles or named approvers, optional **per-category** or **per-location** rules. Lives with future **org or lab policy** (today there is no org model; could start as env or a single `LabSettings` document).
- **Self-approval:** allow **RESEARCHER** (or custodian) to approve their own request when within policy (e.g. under value/duration threshold); **ADMIN** always allowed; **STUDENT** never self-approves. Reduces friction for trusted roles while keeping an audit trail.
- **Automation / rules:** auto-approve when predicates match (e.g. borrower already **ProjectMember** for linked project, quantity 1, duration ≤ 7 days); otherwise enqueue for human review. Document rules clearly for auditors.
- **SLA / timeouts (optional):** auto-escalate or auto-deny after N hours so requests do not stall silently.

#### Product shape (when/if we build)

Sketch only—no schema yet:

- **Request record** (type, payload snapshot, requester, status `PENDING | APPROVED | REJECTED | CANCELLED`, decidedBy, decidedAt, optional comment) *or* status fields on the domain object for a single workflow—choose per feature to avoid over-abstracting on day one.
- **Approver UX:** queue in **Admin** (or **Settings** for “my pending reviews” if approvers are not all admins); link from **notifications** (reuse existing notification patterns where possible).
- **Audit:** append **AuditLog** (or equivalent) on approve/reject; align with export and compliance stories.

**Open decisions:** single global policy vs per-workflow; whether students ever see a “request” button vs hard block; email vs in-app only for approvers; whether v1 is **one** chosen workflow (e.g. signup queue only) vs a generic engine.

### AI assistant integration

**Shipped (phase 1 — read-only):** see **§1 → Ops** — `lib/ai/*`, `POST /api/ai/chat`, toolbar sheet for all lab roles (`components/assistant/staff-assistant-panel.tsx`), env vars in **`.env.example`** (`GEMINI_API_KEY`, optional `GEMINI_MODEL`, `GEMINI_REQUEST_TIMEOUT_MS`, `AI_ASSISTANT_ENABLED`).

**Backlog (phase 2):** **mutating** tools only after safety review — default deny, per-operation flags, confirmation/idempotency where needed, **AuditLog** on every mutation; optional **streaming** replies and **persisted** conversation history per user.

**Principles (unchanged):** no arbitrary code or raw DB against the model; only registered handlers; RBAC on every tool invocation; rate limits on AI routes.

### Near term (concrete, fits current stack)

- **Account / Settings shell**: a small **Settings** area (linked from header user menu) as the home for client prefs first; extend with server fields (e.g. `User.emailNotifications`) as they land.
- **Appearance (client prefs)**: optional **theme** (e.g. light/dark/system) and **density** (comfortable/compact) stored client-side; default remains the current look until the user changes it.
- **Inventory & lists (optional depth)**: URL-stable filters and **column visibility** (+ copy filtered-view link) shipped on `/inventory`; **saved filter presets** still optional; **compact rows** via Settings density (existing).
- **Import UX (deeper)**: optional column remap UI, stronger typed validation — basic **preview + docs** shipped (see **§1** spreadsheet import).
- **E2E in CI (follow-ups)**: nightly / optional Firefox; **Playwright browser cache** in Actions (see **§1**); split job if runtime grows.
- **Overdue email**: digest one email per user per cron batch instead of N emails; respect a future `User.emailNotifications` (or similar) flag. **Branded HTML** layout and shared templates are specified under **§3 → Email notifications — branded HTML layouts & templates (planned)**.

### Email notifications — branded HTML layouts & templates (planned)

**Intent:** keep **transactional email** (overdue notices today via Resend; future digests, project invites, optional approval prompts) visually aligned with the **Vehicle Computing Lab** identity and the app’s design tokens—using **HTML + inline CSS** that survives real inboxes—without pretending email can run the same Tailwind pipeline as the Next.js UI.

**Why HTML and not “just reuse components”:** most mail clients ignore external stylesheets, strip `<style>` blocks inconsistently, and do not execute JS. The practical approach is **tables for structure**, **inline styles for rules that must stick**, and a **small, explicit palette** copied from the web theme (not imported from `globals.css` at runtime in the email path).

**Theme tokens (mirror `app/globals.css` `:root` light theme):** treat these as the **canonical email palette** until we centralize them in a tiny shared module (e.g. `lib/email/theme.ts` exporting hex strings):

| Token | Hex | Use in email |
|-------|-----|----------------|
| Primary | `#144733` | Header bar, primary buttons, key links |
| Primary foreground | `#ffffff` | Text on primary buttons / dark bars |
| Foreground | `#1a1a1a` | Body copy |
| Muted foreground | `#4a5c55` | Secondary text, disclaimers |
| Border | `#d4e0db` | Dividers, card outlines |
| Muted surface | `#f0f4f2` | Alternating rows, callout backgrounds |
| Accent | `#8b7355` | Optional badges, secondary emphasis |
| Destructive | `#b91c1c` | Rare: overdue / action-required emphasis only |

**Default presentation:** ship **light** shells first (best predictability across clients). Optional later: a **`<meta name="color-scheme">`** + limited ** `@media (prefers-color-scheme: dark)`** block for clients that honor it—still keep inline fallbacks so Gmail/Outlook degrades gracefully.

**Layout system (one predefined shell):**

1. **Document skeleton:** HTML5 doctype, `lang`, UTF-8 meta, **hidden preheader** text (first line in inbox preview).
2. **Outer table** ~600px max width, centered; `role="presentation"` on layout tables; adequate padding on small screens (fluid width where safe).
3. **Header row:** Lab Nexus (or VCL) wordmark or text mark, **primary** background or bottom border using **border** token; optional small tagline.
4. **Body slot:** white or **muted** panel with **radius** implied via padding (many clients ignore `border-radius` on nested elements—acceptable if corners are square in some clients).
5. **Footer row:** org name, link to app base URL, **manage notifications** / support line when user prefs exist; plain-text unsubscribe or preference link where policy requires it.
6. **Primary CTA:** bulletproof button pattern (table cell, background **primary**, padding, **primary-foreground** text); always duplicate **plain link** under the button for accessibility and client quirks.

**Templates (start small, compose into the shell):**

| Template id | Purpose | Dynamic blocks |
|-------------|---------|------------------|
| `transactional-base` | Shared wrapper + header/footer | `preheader`, `title` (optional `<title>`), `children` HTML |
| `overdue-borrower` | Borrower overdue notice (extends base) | Asset/checkout summary, due date, link to asset or checkouts |
| `overdue-digest` *(future)* | One mail per user per cron batch | List of items, single CTA to app |
| *(future)* `project-invite`, `approval-request` | When those workflows ship | As needed |

**Implementation options (pick one stack in the PR that adds this):**

- **A — Small HTML builders:** TypeScript functions that return escaped strings and compose fragments; easiest to audit and has no extra deps; duplicate token hex in `lib/email/theme.ts`.
- **B — React Email (or similar):** author templates as components, **render to static HTML** on the server, then send through Resend; still **inline** critical styles at render time per library defaults; good if template count grows.

**Engineering rules:** HTML-escape all user-controlled strings; **no** raw HTML from DB in body without sanitization; keep images **absolute URLs** (hosted logo); **plain-text alternative** (`text` part) for every send that mirrors the CTA links and key facts.

**Quality bar:** manual sends in dev (Resend test domain); optional snapshot tests on rendered HTML; spot-check in Gmail, Outlook, and one mobile client before calling a template “done.”

**Related:** **§1 → Notifications & overdue** (Resend overdue mail); **§3 → Near term** (digest + `User.emailNotifications`); **`.env.example`** Resend vars.

### QR codes & labeling (planned)

*Builds on **§1**: shared **`lib/qr`** (encode any absolute URL into `/api/qr`, host-aware `absoluteUrlForAppPath`) and **`lib/scan`** (generic path decoding + **`resolveInventoryTrackTagScan`**). **Adding another entity later:** introduce `lib/qr/<entity>-target.ts` (compose path + `absoluteUrlForAppPath` + `qrCodePngHrefForAbsoluteUrl`), `lib/scan/<entity>.ts` (DB resolution), and either extend `app/(app)/scan/...` (e.g. prefix segment) or add a dedicated route—keep PNG generation and origin logic in `lib/qr` / `lib/request-origin.ts`.*

*This subsection is **planned UX and workflows**, not committed scope beyond the primitives above.*

- **Individual:** first-class UI on **asset** and **unit** detail to download or print a label (preset sizes/error correction), not only calling the API manually; optional “copy link to scan URL” for digital sharing.
- **Batch:** generate labels for **many** items at once—sources such as **multi-select** on the inventory table, **“all rows matching current filters”**, or **paste list of SKUs/tags**; output as **ZIP of PNGs**, **multi-page PDF**, and/or a **print-optimized sheet** (document which identifier is encoded—`trackTag` vs `skuOrInternalId`—so stickers match scanner behavior).
- **Group / curated sets:** support **grouped runs** without picking rows one-by-one—e.g. **all assets in a category or location**, **all units under an asset**, or a **saved / named set** for recurring print or audit rounds (lightweight; avoid over-building before batch UX is proven).
- **Scanning workflows:** extend beyond single-tag redirect: a **scan entry** (ties to **Mobile-friendly** below) with **session-style multi-scan** (queue of resolved items, optional checklist against an expected list, or bulk “mark seen” for stock checks); clarify camera/PWA vs keyboard wedge / external scanner.
- **Ops:** **RBAC** (e.g. `ADMIN` / `RESEARCHER` for bulk export), **size/rate limits** and **audit** for large downloads; reuse existing patterns from CSV export where sensible.

### Medium term (product + platform)

- **SSO / OIDC**: wire Auth.js provider; map IdP groups → `User.roles[]` via existing `mapExternalProfileToRoles` stub in `lib/auth/roles.ts`.
- **Multi-instance rate limiting**: Redis (or Upstash) backed limiter for login + cron; document stickiness if staying in-memory.
- **Deployment recipes**: Dockerfile + compose profile for `app + mongo`, or one-click notes for Vercel + Atlas + cron.
- **Deeper analytics**: date-range filters, export chart data CSV, checkout duration metrics (filters/export as optional depth on the analytics page).
- **Power-user affordances** (optional): keyboard shortcuts or a shortcuts help panel for frequent navigation/actions; discoverable from Settings so casual users are not burdened.
- **Purchase invoices & procurement records**: attach acquisition evidence to inventory (e.g. vendor, invoice/PO number, date, amount, optional **PDF or file** in guarded storage). Model as `Asset` ↔ invoice (or line-item) relations; decide whether one invoice spans multiple assets vs. one asset multiple invoices over time. **RBAC**: admin/researcher create/edit; students read-only or none. Consider retention, PII on vendor docs, and export for audits alongside existing asset audit trail.
- **Multi-currency (procurement)**: **functional + transaction allow list** shipped (see **§1 → Lab currencies**). Still to build: invoice/line models where each payment stores **charged amount + transaction currency** (legal truth) plus **functional amount** (user-entered or **FX rate + date + source**); no live FX for stored rollups; revisit rounding and mixed-currency invoices.

### Longer term / nice to have

- **Self-service signup** (if policy allows) with admin approval queue — see **Approval flows (plan — discovery)** above for how this might relate to broader approval policy.
- **Asset reservations** (hold before pickup) vs. immediate checkout.
- **Mobile-friendly** scan-first flows (PWA hints, larger tap targets, a clear **Scan** entry) without complicating desktop defaults—coordinate with **QR codes & labeling (planned)** for multi-scan sessions and entry points.
- **Audit**: export audit log CSV; retention policy notes for Mongo.

### Review later — RBAC & enterprise role management

*Deferred product/architecture notes; revisit when SSO, IT policy, or compliance pushes on identity.*

- **Current model:** Three fixed lab roles (`ADMIN`, `RESEARCHER`, `STUDENT`) on `User.roles[]` match most academic lab needs. `STUDENT` is already wired (seed user, checkout eligibility on asset detail, etc.). Optional developer experience only: a dev **Login as student** quick action (parity with admin/staff) if we want faster UX testing.
- **Custom in-app role creation** (admins defining arbitrary roles/permission matrices): generally **not** recommended for this product class—high cost (UI, auditing, tests). Prefer occasional new **named** roles enforced in code with `hasAnyRole` / `assertAnyRole`, plus **ProjectMember** for per-project membership. For UI-level privilege control without a matrix, see **§3 → Access control & privileges (planned — design choice)**.
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

1. **While implementing:** if the work matches **§3**, add or update a **§2** row and dedupe **§3** (remove the bullet or point to §2). New work not in §3 still gets a **§2** row while it is active. Refresh §2 notes as scope changes.
2. **After merging or finishing a feature:** add to **§1** (bullet or table row), remove the **§2** row, and update **Last updated** at the top.
3. When planning only (no code yet): add/adjust **§3** items; break large items into checkboxes in the PR.
4. Keep **§2** honest—one row per active effort; empty is fine (restore the placeholder row).

Cursor / agent sessions: follow `.cursor/rules/plan-md-maintenance.mdc` and the **Engineering plan** note in `AGENTS.md` so WIP and delivered stay current during the same change series.

5. **Prisma / seed changes:** After adding or materially changing models in `schema.prisma` or seed output, run **`pnpm db:reset`** locally for a **fresh** dataset; extend **`prisma/clear-database.ts`** for new collections. See `.cursor/rules/database-seed-reset.mdc` and **Database and seed** in `AGENTS.md`.

---

## 6. Related files

| File | Role |
|------|------|
| [`README.md`](./README.md) | **Docker-first** local setup (**Compose profile `full`**, optional Mongo-only + `pnpm dev`), env, seed, deployment notes; manual **`pnpm db:reset`** when schema/seed changes on host workflows |
| [`docker-compose.yml`](./docker-compose.yml), [`Dockerfile`](./Dockerfile) | Mongo + persistent volume; **`--profile full`** → `mongo-init`, one-shot **`seed`** (`prisma/seed-gate.ts`), **`app`** ([`Dockerfile`](./Dockerfile) standalone); optional **`LAB_NEXUS_*_HOST_PORT`** overrides |
| [`.cursor/rules/database-seed-reset.mdc`](./.cursor/rules/database-seed-reset.mdc) | Agent rule: fresh reseed + `clear-database.ts` when entities change |
| [`.env.example`](./.env.example) | Variable templates |
| `lib/ai/*`, `app/api/ai/chat/route.ts`, `components/assistant/staff-assistant-panel.tsx` | Optional Lab assistant (all lab roles): Gemini client, Zod-validated tool registry, orchestration (max tool rounds), chat API + toolbar sheet — see **§1 → Ops** and **§3 → AI assistant integration** |
| `lib/currency/*`, `LabCurrencyConfig`, `/settings/currencies` | Functional + transaction currency allow list; `getCachedLabCurrencyConfig`, formatting helpers |
| `lib/email/*`, `emails/*` *(planned)* | Branded **HTML** transactional templates, theme tokens, render helpers; Resend send paths — see **§3 → Email notifications — branded HTML layouts & templates** |
| `lib/import/*`, **Admin → Import** | Spreadsheet parse, shared row pipeline (`preview` / `apply`), column-hint catalog for `/admin/import` |
| `lib/qr/*`, `GET /api/qr` | Reusable QR PNG generation and href building; entity-specific `*-target.ts` modules |
| `lib/scan/*`, `app/(app)/scan/*` | Path decoding + inventory track-tag resolver; extend with new resolvers/routes for other entities |
| `lib/request-origin.ts` | Request host / forwarded headers for QR and share links (staging vs prod vs localhost) |
