# Lab Nexus

Vehicle Computing Lab **centralized inventory** web app: who has what, where it lives, when it is due back, and an audit trail.

The Next.js application lives at the **repository root** (this folder).

---

## Plan and scope

A living **roadmap** (delivered vs. WIP vs. backlog) lives in [`plan.md`](./plan.md).

### Goals

- Single place for lab hardware: **CRUD**, **filters**, **photos**, **locations**, **categories**, **projects**.
- **Check-out / check-in** with expected return dates, **availability**, and **audit log** entries on assets.
- **Roles** (`admin`, `researcher`, `student`, …) via `User.roles[]` and server-side checks.
- **Admin** views: KPI-style summaries, overdue list, recent audit, **CSV export**, **spreadsheet import** (heuristic column mapping).
- **Overdue**: cron-friendly API that marks overdue checkouts and creates **in-app notifications**.
- **QR**: PNG endpoint and **`/scan/[tag]`** deep link for assets with `trackTag`.
- **Branding**: VCL green/white tokens, lab logo.

### Stack

Next.js 16, React 19, Tailwind 4, Prisma 6 + MongoDB, Auth.js (Credentials + JWT), Zod, bcrypt, shadcn-style UI primitives, Sonner, `xlsx`, `qrcode`.

### Implemented in this repo

- Auth (credentials, JWT), login, app layout guard (no Edge middleware; Prisma stays on Node).
- Inventory list / detail / create / edit, RBAC for mutating actions, image upload.
- Checkouts list and flows; audit log on asset; overdue cron route + notification creation.
- Notifications list page with **mark read** (per item and mark all) and an unread badge in the header.
- Admin dashboard, import UI, **CSV export** for inventory and **full checkout history** (`/api/admin/export/inventory`, `/api/admin/export/checkouts`).
- **`AssetUnit`**: tracked units on the asset detail page (add/remove for admin/researcher); checkout requires choosing a unit when any exist; quantities stay in sync; seed demo includes two units on the 5G asset; `/scan/[tag]` resolves **unit** track tags to the parent asset.
- **`ProjectMember`**: **Projects** nav, list/create projects (admin/researcher), project detail with add/remove members by email; seed links the demo researcher to “Autonomous driving”.
- **Email (overdue)**: optional [Resend](https://resend.com) — when `RESEND_API_KEY` and `EMAIL_FROM` are set, borrowers get an email when the cron job marks their checkout overdue (in addition to in-app notifications).
- **Analytics**: **Admin → Analytics** — checkout volume (30-day bar chart), assets by category, top borrowers, checkout counts by status.
- **Production hardening**: sign-in **rate limiting** by IP (in-memory, per process); **cron route** burst + failed-auth throttling; **Playwright** smoke tests (`pnpm test:e2e`, needs dev server + DB); **GitHub Actions** workflow (lint + build); **`GET /api/health`** (liveness) and **`GET /api/health/ready`** (Mongo ping); **Admin → Refresh overdue** runs the same overdue job as cron without mutating on every admin page load; baseline **security headers** (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) on all routes via `next.config.ts`.

### Stretch / multi-instance notes

- For several app instances, replace in-memory rate limits with Redis (or similar) and monitor Resend quotas.

---

## Package manager: pnpm

Use **pnpm** only (not npm or yarn). From the repo root:

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
pnpm build && pnpm start   # production
pnpm lint
pnpm db:push               # Prisma schema → MongoDB
pnpm db:seed               # demo users + sample assets
pnpm test:e2e              # Playwright (run `pnpm dev` first, then `pnpm exec playwright install` once)
```

Optional: set **`E2E_EMAIL`** and **`E2E_PASSWORD`** in the environment (e.g. seed admin) to enable the authenticated test in `e2e/auth-flow.spec.ts`.

---

## Environment variables

Copy [`.env.example`](./.env.example) to `.env` and set at least:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MongoDB connection string (must be a **replica set** URI for Prisma) |
| `AUTH_SECRET` | Auth.js secret (generate a long random string) |
| `CRON_SECRET` | Bearer token for `GET /api/cron/overdue` |
| `RESEND_API_KEY` | Optional — send overdue emails via Resend |
| `EMAIL_FROM` | Optional — sender address (e.g. `Lab Nexus <onboarding@resend.dev>`), required with Resend |

**Precedence:** If `DATABASE_URL` is set in your **shell** environment, it overrides values in `.env`. For local Prisma/seed, either unset it in the shell or point it at the same database you intend to use.

---

## MongoDB (replica set)

Prisma requires MongoDB as a **replica set** (including a single-node replica set).

**Local Docker** (see [`docker-compose.yml`](./docker-compose.yml)):

1. `docker compose up -d` from the repo root (or with `-f docker-compose.yml`).
2. Initialize once (adjust container name if yours differs):

   ```bash
   docker exec -it lab-nexus-mongo mongosh --eval "rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'localhost:27017' }] })"
   ```

3. `DATABASE_URL` should match that deployment (e.g. `mongodb://127.0.0.1:27017/lab-nexus?replicaSet=rs0` — follow your compose host/port).

**MongoDB Atlas:** use the connection string Atlas provides for a replica set. Do **not** append a random `replicaSet=rs0` meant for local Docker.

Then:

```bash
pnpm db:push
pnpm db:seed
```

**Demo logins** (after seed): `admin@lab.local`, `researcher@lab.local`, `student@lab.local` — password **`labnexus123`**.

---

## Cron (overdue checkouts)

Set `CRON_SECRET` in `.env`. Call periodically:

`GET /api/cron/overdue` with header `Authorization: Bearer <CRON_SECRET>`.

If Resend is configured, borrowers receive an email when their loan is marked overdue.

---

## CI

On push/PR to `main` or `master`, [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs `pnpm lint` and `pnpm build` (with placeholder env — no live MongoDB required for the Next.js build).

---

## Health checks

- **`GET /api/health`** — JSON `{ ok: true }` when the Node process is running (use for **liveness**).
- **`GET /api/health/ready`** — **503** if MongoDB is unreachable; **200** with `{ ok: true, db: true }` when Prisma can ping the database (use for **readiness**).

---

## Learn more

- [Next.js documentation](https://nextjs.org/docs)
- [pnpm documentation](https://pnpm.io/motivation)
