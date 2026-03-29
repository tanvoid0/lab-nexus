# Lab Nexus

**Lab Nexus** is the Vehicle Computing Lab’s **centralized inventory** web app: track **who has what**, **where it lives**, **when it is due back**, and keep an **audit trail** across hardware and projects.

The Next.js app lives at the **repository root**. A broader roadmap (delivered / WIP / backlog) is in [`plan.md`](./plan.md).

---

## Features

### Roles and access

- **STUDENT**, **RESEARCHER**, and **ADMIN** roles (`User.roles[]`), enforced in **server actions** and **API routes** (no Edge middleware; Prisma runs on the Node runtime).
- **ADMIN** can manage **lab accounts** (`/admin/users`): deactivate or restore users (soft delete; sign-in blocked when deactivated).

### Dashboard and inventory

- **Dashboard** (`/`) with role-aware shortcuts, checkout summaries, and (for staff) embedded **analytics** widgets.
- **Inventory** list with **filters** (category, location, project, condition, operational status), **search** (name, SKU, track tag), optional **columns** (incl. project) with **view link** preserved in the query string, and **CSV-friendly** workflows.
- **Asset detail**: image, notes, **audit** on the asset, **AssetUnit** sub-units (add/remove for staff); checkout **requires a unit** when units exist; **soft delete** for admins (archived assets hidden from lists/scan/export).
- **Create / edit** assets with RBAC for mutating actions and **image upload**.

### Lending: cart, checkout, and approvals

- **Checkouts** list and **check-out / check-in** flows with expected return, quantity, and optional **purpose**.
- **Borrow cart** (`/cart`): persisted **UserCart** (DB + debounced sync), **Add to cart** from inventory/project tables and asset detail; default/per-line **project**.
- **Checkout requests** (`/requests`, `/requests/[id]`): **STUDENT** submissions go to staff **approval**; **RESEARCHER** / **ADMIN** can **submit the cart** to create **Checkout** records directly.
- **Admin → Loan approvals** (`/admin/checkout-requests`): queue and actions for pending requests.

### Projects

- **Projects** (`/projects`): create projects (staff), **project member** management by email, project **profile** (description, links, document URLs), and **assign inventory** to a project; inventory and exports reflect project context.

### Scanning and QR

- **QR** PNGs via **`GET /api/qr`**; **Scan & QR** on asset detail with a scan target when multiple tags exist.
- **`/scan/[...tag]`** (and legacy **`/scan/[tag]`**) resolves **inventory track tags** to an asset or **unit** (unit tags redirect with **`?unit=`** when needed).

### Notifications and overdue

- **In-app notifications** when checkouts become **overdue**; **Notifications** page with **mark read** / **mark all** and header **unread** badge.
- **Cron-friendly** overdue job: **`GET /api/cron/overdue`** with **`Authorization: Bearer <CRON_SECRET>`**; **Admin → Refresh overdue** runs the same job without coupling it to every page load.
- Optional **email** to borrowers via **[Resend](https://resend.com)** when overdue (`RESEND_API_KEY`, `EMAIL_FROM`).

### Admin

- **Admin dashboard** (`/admin`): KPI-style summaries and overdue focus.
- **Analytics** (`/admin/analytics`): checkout volume, assets by category, top borrowers, status breakdowns (charts via Recharts).
- **Audit trail** (`/admin/audit`): filterable **audit** log (entity-scoped links where applicable).
- **Reference data** (`/admin/reference-data`): **categories**, **locations**, and **lookup entries** for asset **condition** and **operational status** (codes, labels, sort order, archive/soft delete). **Checkout statuses** (`ACTIVE` / `RETURNED` / `OVERDUE`) stay **workflow state** in code—not admin-editable taxonomy.
- **Import** (`/admin/import`): spreadsheet **import** with heuristic column mapping and **preview** dry-run.
- **CSV export**: inventory and **full checkout history** (`/api/admin/export/inventory`, `/api/admin/export/checkouts`).
- **Lab currencies**: functional (base) + allowed transaction ISO codes (`/settings/currencies` for **ADMIN**; optional **`LAB_FUNCTIONAL_CURRENCY`** env for first seed).

### Settings

- **`/settings`**: **appearance** (e.g. theme) and other **per-user** preferences; **Lab assistant** section when the AI feature is enabled. **Admin** sees **lab currency** entry from here.

### Optional: Lab AI assistant

- When **`GEMINI_API_KEY`** is set and **`AI_ASSISTANT_ENABLED`** is not **`false`**, signed-in lab roles get a toolbar **Lab assistant** (Gemini, read-only tools: inventory search, track-tag resolve, **my** checkouts, reference labels; **ADMIN** also gets **audit** lookup). Server API: **`POST /api/ai/chat`**. See **`lib/ai/`** and **`.env.example`**.

### Security and ops (baseline)

- Sign-in **rate limiting** (in-memory, per IP); cron route **burst** + stricter limit on failed Bearer.
- **Security headers** in `next.config.ts` (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).
- **`GET /api/health`** (liveness), **`GET /api/health/ready`** (Mongo ping for readiness).

**Multi-instance note:** for several app replicas, plan to replace in-memory rate limits with **Redis** (or similar) and monitor Resend quotas.

---

## Tech stack

Next.js 16, React 19, Tailwind 4, Prisma 6 + MongoDB, Auth.js (credentials + JWT), Zod, bcrypt, shadcn-style UI, Sonner, Font Awesome, `xlsx`, `qrcode`, Recharts, Playwright (optional E2E).

---

## Prerequisites

- **Docker** — easiest way to run the app + database together ([`docker-compose.yml`](./docker-compose.yml)).
- **Node.js 20+** and **pnpm 10** — needed for `pnpm dev` and other scripts ([`package.json`](./package.json) `packageManager`).
- **MongoDB as a replica set** — Compose gives you one locally; for cloud, use **Atlas** and the connection string they provide (don’t mix in local-only `replicaSet=` query params).

---

## Local setup

Work from the **repo root**. **Try Docker first**; use the manual path if you prefer `pnpm dev` with hot reload or you already have Mongo elsewhere.

### Step 0 — Environment file (every path)

```bash
cp .env.example .env
```

Set at least **`AUTH_SECRET`**, **`CRON_SECRET`**, and **`DATABASE_URL`** (details in [`.env.example`](./.env.example)).

| When | `DATABASE_URL` in `.env` |
|------|---------------------------|
| **Docker full stack** (`docker compose --profile full`) | Can be a placeholder or Atlas; containers **override** it to talk to the Compose **`mongo`** service. |
| **`pnpm dev` on your machine** | Must point at **your** Mongo (local or Atlas). |

If **`DATABASE_URL`** is also set in your **shell**, it wins over `.env` — unset it if things point at the wrong DB.

---

### Path A — Full stack in Docker (recommended)

1. Create **`.env`** (see Step 0).
2. Start everything:

   ```bash
   docker compose --profile full up -d --build
   ```

3. Open **[http://localhost:3000](http://localhost:3000)**.

**What you get:** MongoDB data is stored in the **`lab-nexus-mongo-data`** volume (survives image rebuilds). The first time the database is empty, Compose runs a **seed** step; after that it skips. Demo sign-in uses **`labnexus123`** unless you set **`SEED_DEMO_PASSWORD`** in `.env`.

**If sign-in redirects act odd on localhost:** add **`AUTH_TRUST_HOST=true`** to `.env`.

**If ports 27017 or 3000 are already in use:**

```bash
LAB_NEXUS_MONGO_HOST_PORT=27018 LAB_NEXUS_APP_HOST_PORT=3000 docker compose --profile full up -d --build
```

(Use the Mongo host port in any **host-side** `prisma` commands — see [`docker-compose.yml`](./docker-compose.yml).)

**If replica-set errors appear** after switching how you run Mongo on the same volume: **`docker compose --profile full down -v`** resets **only** that Compose Mongo data.

**Optional:** from the repo, **`pnpm exec prisma db push`** against `127.0.0.1:<mongo host port>?replicaSet=rs0&directConnection=true` if you want indexes explicitly aligned before you rely on seeding.

---

### Path B — Mongo in Docker, app on your machine (`pnpm dev`)

1. **`.env`** with a **local** URI (see Step 0).
2. Start Mongo and init the replica set **once**:

   ```bash
   docker compose up -d mongo
   docker exec -it lab-nexus-mongo mongosh --eval "rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'localhost:27017' }] })"
   ```

3. Set **`DATABASE_URL`** to something like:  
   `mongodb://127.0.0.1:27017/lab-nexus?replicaSet=rs0`

4. Continue with **Path C** (install → `db:push` → `db:seed` → `pnpm dev`).

---

### Path C — Manual (no Docker app; Mongo from Compose, Atlas, or elsewhere)

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```

Open **[http://localhost:3000](http://localhost:3000)**.

- **Accounts:** `admin@lab.local`, `researcher@lab.local`, `student@lab.local` (override with `SEED_*_EMAIL` in `.env`).
- **Password:** without **`SEED_DEMO_PASSWORD`**, the first seed may write a random password to **`prisma/.seed-demo-credentials.json`** (gitignored). Set **`SEED_DEMO_PASSWORD`** for a fixed password (e.g. E2E tests).
- **Do not** run **`pnpm db:seed`** against production (`NODE_ENV=production` / `VERCEL_ENV=production` are blocked).
- After **schema or seed** changes locally, **`pnpm db:reset`** is usually easiest (clears, pushes, reseeds).

**Production-like run on the host:** `pnpm build` then `pnpm start` (same `.env`).

**Dev quick login** buttons on the login page only appear in **development** builds.

---

## Useful scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Next.js dev server |
| `pnpm build` | `prisma generate` + production build |
| `pnpm start` | Production server (after `pnpm build`) |
| `pnpm lint` | ESLint |
| `pnpm db:push` | Push Prisma schema to MongoDB |
| `pnpm db:seed` | Seed demo users, lookups, sample data |
| `pnpm db:clear` | Wipe app collections (blocked in production) |
| `pnpm db:reset` | `db:clear` + `db push` + `db:seed` |
| `pnpm db:migrate-legacy-enums` | One-time migration for old Asset enum fields (existing DBs only) |
| `pnpm test:e2e` | Playwright (install browsers once: `pnpm exec playwright install chromium`) |

---

## Environment variables (reference)

See [`.env.example`](./.env.example) for the full list and comments. Commonly used beyond the minimum:

- **`LDAP_ALLOWED_DOMAINS`** — optional comma-separated email domain allow list for sign-in.
- **`NEXTAUTH_URL`** / **`AUTH_URL`** / **`APP_URL`** — public URL for Auth.js and absolute links (e.g. overdue email); on Vercel you often set **`AUTH_TRUST_HOST=true`** and the URL Vars Vercel provides.
- **`LAB_FUNCTIONAL_CURRENCY`** — bootstrap ISO 4217 code before the lab saves currency settings in-app.
- **`GEMINI_*`**, **`AI_ASSISTANT_ENABLED`** — Lab assistant (see above).

---

## MongoDB: replica set (why and how)

Prisma expects a **replica set** URI (a single-node replica set is fine for local dev).

- **Local:** Path A or B above, or [`docker-compose.yml`](./docker-compose.yml).
- **Atlas:** use the **SRV** string from the Atlas UI — don’t add local-only `replicaSet=` query params.

**Upgrading old databases:** if documents still use legacy Prisma enum fields `condition` / `operationalStatus` on **Asset**, run **`pnpm db:migrate-legacy-enums`** once after `db:push` (stop the dev server first if Windows reports a Prisma file lock).

---

## Cron (overdue checkouts)

Configure **`CRON_SECRET`** in `.env`. Call periodically:

`GET /api/cron/overdue` with header `Authorization: Bearer <CRON_SECRET>`.

If Resend is configured, borrowers can also receive an **email** when marked overdue.

---

## Health checks

- **`GET /api/health`** — `{ ok: true, service, ts, assistant: { active, configured } }` for **liveness** (`active` / `configured` are booleans only; no API keys). **429** if a client exceeds the per‑IP fixed window (see `lib/api/rate-limit-http.ts`).
- **`GET /api/health/ready`** — **503** if MongoDB is unreachable; **200** with `{ ok: true, db: true, ts, assistant }` when Prisma can ping the database ( **readiness** ). Same per‑IP limit and assistant snapshot.

Other unauthenticated or high‑cost routes use the same in‑memory per‑IP pattern where it matters (e.g. **`GET /api/qr`**, **`/api/assistant/*`**, dev inventory seed, **`POST /api/ai/chat`** pre‑auth shield). Prefer **Redis** (or similar) if you run many app instances—limits are **per Node process** today.

---

## Deployment (e.g. Vercel)

- Set **environment variables** in the host dashboard (`DATABASE_URL`, `AUTH_SECRET`, `CRON_SECRET`, optional Resend/Gemini, public URL vars).
- Use a **managed MongoDB** URI (e.g. Atlas) that already describes a replica set.
- Do **not** commit **`.env`**; keep **`.env.example`** as the template only.

---

## Learn more

- [Next.js documentation](https://nextjs.org/docs)
- [pnpm documentation](https://pnpm.io/motivation)
- [Prisma + MongoDB](https://www.prisma.io/docs/orm/overview/databases/mongodb)
