# SHOE MAFIA

Production-ready Next.js storefront and admin portal for SHOE MAFIA, Bus Stand, Old Telephone Exchange Road, Bilaspur, Telipara, Chhattisgarh 495001.

The catalog starts empty. No sample products, orders, or reviews are seeded.

## Local setup (Windows, no Docker)

This project uses **Node.js + MySQL 8 only**. There is no Docker configuration and none is required.

### 1. Install Node.js 20+

1. Download the **LTS** installer from [https://nodejs.org](https://nodejs.org).
2. Run the installer (defaults are fine).
3. Verify in PowerShell:

```powershell
node -v
npm -v
```

You need `node` v20 or higher.

### 2. Install MySQL 8 on Windows

1. Download **MySQL Installer** for Windows from [https://dev.mysql.com/downloads/installer/](https://dev.mysql.com/downloads/installer/) (choose the full installer or web installer).
2. Run the installer. Choose **Custom** or **Developer Default** so **MySQL Server 8.x** is installed.
3. During setup:
   - **Config Type:** Development Computer (or Server Computer).
   - **Connectivity:** TCP/IP, port **3306**, leave “Open Windows Firewall” checked if offered.
   - **Authentication:** use **MySQL Native Password** / legacy-compatible auth if the wizard asks (works well with Prisma).
   - Set a **root password** and remember it.
4. Finish the wizard and ensure **MySQL80** (or similar) is running as a **Windows service** (Services app → MySQL80 → Running).

Optional: install **MySQL Workbench** from the same installer to run SQL with a GUI.

### 3. Create the database and app user

Open **MySQL Workbench** (or `mysql` from the MySQL `bin` folder) and connect as **root**. Run:

```sql
CREATE DATABASE shoe_mafia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'shoemaafia'@'localhost' IDENTIFIED BY 'shoemaafia';
CREATE USER 'shoemaafia'@'127.0.0.1' IDENTIFIED BY 'shoemaafia';

GRANT ALL PRIVILEGES ON shoe_mafia.* TO 'shoemaafia'@'localhost';
GRANT ALL PRIVILEGES ON shoe_mafia.* TO 'shoemaafia'@'127.0.0.1';

FLUSH PRIVILEGES;
```

Use your own password instead of `shoemaafia` in production.

### 4. Configure `.env`

In the project folder, copy `.env.example` to `.env` if you do not already have `.env`.

Set at least:

```env
DATABASE_URL="mysql://shoemaafia:shoemaafia@127.0.0.1:3306/shoe_mafia?connection_limit=10"
APP_URL="http://localhost:3000"
ADMIN_SESSION_SECRET="paste-a-long-random-string-here"
ADMIN_USERNAME="sHoeMafia"
ADMIN_PASSWORD="change-me-before-production"
ADMIN_EMAIL="admin@shoemaafia.local"
```

Match `DATABASE_URL` to the user, password, host, and database you created.

### 5. Install the app and create tables

In PowerShell:

```powershell
cd "C:\Users\Harshit\Downloads\shoe mafia\shoe mafia"
npm install
npx prisma generate
npx prisma migrate deploy
npm run setup:admin
npm run dev
```

- `migrate deploy` creates all tables in `shoe_mafia`.
- `setup:admin` creates or resets the admin user from `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

### 6. Open the site

- Shop: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

Place the official logo at `public/brand/logo.png`.

### Every time you work on the project

1. Confirm MySQL is running (Windows service **MySQL80**).
2. In the project folder: `npm run dev`.

### Troubleshooting

| Error | Fix |
|-------|-----|
| Can't reach database server | Start MySQL service; check port 3306. |
| Access denied | User/password in `DATABASE_URL` must match MySQL; try `127.0.0.1` vs `localhost` consistently. |
| Unknown database | Run the `CREATE DATABASE shoe_mafia` SQL again. |

## Busy Excel import

Use **Admin → Busy import**. Upload `.xlsx` or `.csv` (save Busy `.xls` files as `.xlsx` or `.csv` first). Map columns, preview a sample, then start a background job. Progress, retry for failed rows, and error CSVs are on the job page. Size rows are grouped only when item code, group key, or an exact parent identifier matches.

## Payments and images

- Razorpay: set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, then enable payments in **Settings**. Until keys exist, checkout stays on cash on delivery.
- Product photos: upload in Admin → Products (files are stored in MySQL and served from `/api/media/...`).

## Hosting (not Vercel)

The app uses `output: "standalone"` for a Node.js host such as Railway or a Hostinger VPS.

- Provide a persistent MySQL database.
- Set all environment variables from `.env.example`.
- Run `npx prisma migrate deploy` on each release.
- Run `npm run worker` as a second process if imports must continue independently of the web process. The web process also resumes queued jobs via `instrumentation.ts`.
- Point the domain at the Node server and terminate HTTPS at Nginx/Caddy or the platform load balancer.
- Back up MySQL with `mysqldump` on a schedule; restore with `mysql < backup.sql`. Do not drop the production database during deploys.

### Railway

Create a Node service from this repo and a MySQL plugin. Set `DATABASE_URL` to the plugin URL. Build command: `npm ci && npx prisma generate && npm run build`. Start command: `node .next/standalone/server.js` after copying `public` and `.next/static` into the standalone folder, or `npm start` if you keep the full install.

### Hostinger VPS

Install Node 20, MySQL 8, and Nginx. Clone the repo, configure `.env`, run migrations, then `npm run build && npm start` behind a process manager such as systemd or pm2.

Deployment details for Railway and Hostinger VPS, including backups, HTTPS, and the import worker, are in `docs/DEPLOY.md`.

## Load-testing plan (run after MySQL is populated)

Do not claim a capacity number until these have been measured on the target host.

1. Product search: import a Busy export (or a generated CSV of 25,000 parent rows with several sizes), then run `k6` or `autocannon` against `/shop?q=…` and `/api/products?q=…` for 1–5 minutes. Watch MySQL CPU and p95 latency.
2. Bulk import: upload a 25,000-row `.xlsx` or `.csv`. Confirm the browser only receives a header preview, the job page streams progress, memory on the worker stays bounded, and a restart resumes from `lastProcessedRow`.
3. Checkout: with one variation at stock 1, send two concurrent `POST /api/orders` requests. Exactly one order should succeed; available stock must not go negative.
4. Inventory: mix imports and checkouts on the same SKU and confirm `stock`, `reserved`, and `available` stay consistent with `InventoryMovement` rows.

## Checks

```bash
npm test
npm run lint
npm run build
```
