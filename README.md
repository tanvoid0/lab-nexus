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

- **Node.js** 20 or newer (22 is a good default).
- **pnpm** 10 — the repo pins it via Corepack (`package.json` → `packageManager`).
- **MongoDB** as a **replica set** (single-node RS is fine locally). Easiest path: **Docker** + [`docker-compose.yml`](./docker-compose.yml). **Atlas** is supported for hosted deployments—use the URI Atlas gives you (do not paste a random `replicaSet=rs0` from local docs onto the Atlas string).

---

## Local setup

Follow these steps once per machine (from the **repo root**).

### 1. Install dependencies

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm install
```

`postinstall` runs **`prisma generate`**.

### 2. Configure environment

```bash
cp .env.example .env
```

Edit **`.env`** and set at least:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MongoDB replica-set URI (see below). |
| `AUTH_SECRET` | Long random secret for Auth.js (e.g. `openssl rand -base64 32`). |
| `CRON_SECRET` | Secret for `GET /api/cron/overdue` (`Authorization: Bearer …`). |

Optional variables (email, AI, domain restriction, seed overrides) are documented in [`.env.example`](./.env.example).

**Shell vs file:** if `DATABASE_URL` is set in your **shell**, it overrides **`.env`**. For fewer surprises, align shell and `.env` or unset the shell value when working locally.

### 3. Start MongoDB (Docker)

By default, **`docker compose up -d`** starts **only MongoDB** (see [`docker-compose.yml`](./docker-compose.yml)). Data is stored in the **`lab-nexus-mongo-data`** volume.

Initialize the replica set **once** if you run the app **on the host** (`pnpm dev` / `pnpm start`) and connect with `127.0.0.1`:

```bash
docker compose up -d
docker exec -it lab-nexus-mongo mongosh --eval "rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'localhost:27017' }] })"
```

Point **`DATABASE_URL`** in **`.env`** at that instance, for example:

`mongodb://127.0.0.1:27017/lab-nexus?replicaSet=rs0`

#### Run Mongo + Next.js in Docker (full stack)

Use this when you want the **production server** in a container; it still reads **`AUTH_SECRET`**, **`CRON_SECRET`**, and every other variable from **`.env`** via Compose **`env_file`**. **`DATABASE_URL`** from the file is **overridden inside the app container** so it uses the Compose service hostname **`mongo`** (your host‑side URL is unchanged if you keep using `pnpm dev` separately).

```bash
docker compose --profile full up -d --build
docker compose exec app npx prisma db push
docker compose exec app npx tsx prisma/seed.ts
```

Then open [http://localhost:3000](http://localhost:3000).

For Auth.js behind `http://localhost:3000`, set **`AUTH_TRUST_HOST=true`** in **`.env`** if sign‑in redirects misbehave. The **full** profile runs a one‑shot **`mongo-init`** replica‑set bootstrap for the in‑Docker hostname **`mongo:27017`**. If you previously initialized the same volume with **`localhost`** for host‑only dev and hit replica‑set errors, reset the volume: **`docker compose down -v`** (destroys local Mongo data).

The image is built from the repo‑root [`Dockerfile`](./Dockerfile) (**Next.js `standalone`** output).

### 4. Apply schema and seed demo data

```bash
pnpm db:push
pnpm db:seed
```

- **Never** run **`pnpm db:seed`** against **production**: the seed script refuses when `NODE_ENV=production` or `VERCEL_ENV=production`.
- After **schema or seed script** changes locally, prefer **`pnpm db:reset`** (clear + push + seed) so data stays consistent. Extend **`prisma/clear-database.ts`** if you add new collections.

### 5. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with the seeded accounts:

- **Emails:** `admin@lab.local`, `researcher@lab.local`, `student@lab.local` (override with `SEED_*_EMAIL` in `.env` if needed).
- **Password:** first local seed without `SEED_DEMO_PASSWORD` writes a **random** password to **`prisma/.seed-demo-credentials.json`** (gitignored). Set **`SEED_DEMO_PASSWORD`** in `.env` if you want a known password (e.g. for **`pnpm test:e2e`** with **`E2E_EMAIL`** / **`E2E_PASSWORD`**).

**Dev quick login:** in **development**, the login form includes **Login as admin / staff / student** (after seed); those controls are not shown on production builds.

Bulk inventory from seed is **synthetic** unless you add **`prisma/data/inventory-seed.json`** or **`INVENTORY_SEED_JSON`**.

### 6. Production-like run (optional)

```bash
pnpm build
pnpm start
```

Uses the same **`.env`** as dev; ensure **`DATABASE_URL`** and secrets point at the intended database.

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

Prisma expects a **replica set** connection (including a **single-member** set for local dev).

- **Docker:** see **§ Local setup** and [`docker-compose.yml`](./docker-compose.yml).
- **Atlas:** use the **SRV** connection string from the Atlas UI; do not tack on local-only `replicaSet` query params.

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
