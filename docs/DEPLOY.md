# Deploy SHOE MAFIA (not Vercel)

The app is a Next.js Node server (`output: "standalone"`) plus MySQL. Do not use Vercel: bulk Busy imports, the import worker, and persistent file uploads need a long-running Node process and a real MySQL disk.

## Required environment

Copy `.env.example` to `.env` on the server. Set at least:

- `DATABASE_URL` — MySQL 8 URL. Example: `mysql://USER:PASS@HOST:3306/shoe_mafia?connection_limit=10`
- `APP_URL` — public HTTPS origin, e.g. `https://www.example.com`
- `ADMIN_SESSION_SECRET` — 32+ random characters
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_EMAIL` — first admin (created if the admin table is empty)
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` — leave empty until Razorpay is activated
- Product images are stored in MySQL (`StoredImage`); no third-party image host is required
- `IMPORT_WORKER=1` on the web process, or `IMPORT_WORKER=0` if you run `npm run worker` separately

Place the official logo at `public/brand/logo.png` before building.

## Database

```bash
npx prisma generate
npx prisma migrate deploy
npm run setup:admin
```

Never drop the production database as part of a release. Migrations only add or alter schema.

### Backup

```bash
mysqldump -u USER -p --single-transaction --routines shoe_mafia > backup-$(date +%F).sql
```

### Restore

```bash
mysql -u USER -p shoe_mafia < backup-YYYY-MM-DD.sql
```

Keep backups off the app server. Test a restore on a staging database.

## Railway

1. Create a MySQL plugin and a Node service from this repository.
2. Set every variable from `.env.example`.
3. Build: `npm ci && npx prisma generate && npm run build`
4. Release: `npx prisma migrate deploy`
5. Start: `node .next/standalone/server.js`

After `next build`, copy `public` and `.next/static` into the standalone output (Next documents this under standalone):

```bash
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
```

Railway memory limits can stall a 25,000-row import. Use a plan with enough RAM, or run `npm run worker` as a second service with `IMPORT_WORKER=0` on the web service.

HTTPS and the domain are configured in Railway. Point the Razorpay webhook to `https://YOUR_DOMAIN/api/payments/razorpay/webhook`.

## Hostinger VPS (or any Ubuntu VPS)

1. Install Node.js 20, MySQL 8, Nginx, and a process manager (systemd or pm2).
2. Create database `shoe_mafia` with utf8mb4.
3. Clone the repo, install, migrate, build.
4. Run `npm start` (or standalone `node .next/standalone/server.js`) on 127.0.0.1:3000.
5. Nginx terminates HTTPS (Let’s Encrypt) and proxies to port 3000.
6. Optionally: `IMPORT_WORKER=0` on the web unit and a second systemd unit for `npm run worker`.
7. Persist `data/imports` on disk so interrupted Busy uploads can resume.

Example systemd unit:

```
[Service]
WorkingDirectory=/var/www/shoe-mafia
EnvironmentFile=/var/www/shoe-mafia/.env
ExecStart=/usr/bin/npm start
Restart=always
```

## Background imports

Busy files are stored under `data/imports` and processed in chunks. The web process starts a worker via `instrumentation.ts` unless `IMPORT_WORKER=0`. For large catalogs, a dedicated worker process is more reliable than relying on a single web replica.

## Hosting limits

- A single 512MB container may run out of memory while parsing a large `.xlsx`. Prefer `.csv` for very large Busy exports, or increase RAM.
- Do not run multiple import workers against the same job without the status claim in `processImportJob`.
- Razorpay stays inactive until keys exist; checkout uses cash on delivery until payments are enabled in Admin → Settings.
