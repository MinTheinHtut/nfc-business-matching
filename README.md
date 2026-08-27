# NFC Business Matching

A prototype event system where an exhibitor opens a visitor/company URL from an NFC tag, confirms the contact, and later sees it on their dashboard. Organizers manage exhibitors, visitors, NFC links, and confirmations through the admin interface.

## Architecture

`NFC tag → company URL → React frontend → Express API → MySQL/MariaDB`

The NFC tag stores only the public URL. Authentication, company information, and confirmation records remain in the application and database.

## Requirements

- Node.js and npm
- XAMPP with MySQL/MariaDB

The local database is `nfc_business_matching` at `127.0.0.1:3306` by default.

## Local setup

1. Start MySQL from the XAMPP control panel.
2. Copy `.env.example` to `.env` in the project root and replace `SESSION_SECRET` with a private random value.
3. Install dependencies and prepare demo data from the project root:

```bash
npm run install:all
npm run db:setup
npm run db:seed
```

4. Start the backend in one terminal:

```bash
npm run backend:dev
```

5. Start the frontend in another terminal:

```bash
npm run frontend:dev
```

The frontend runs at `http://localhost:5173`; the API runs at `http://localhost:3000`.

Frontend API requests use `VITE_API_URL`. The optional `frontend/.env` can override
the local default; copy `frontend/.env.example` when an explicit local setting is
useful. Keep real `.env` files private.

You can also work inside each package with `npm install`, followed by `npm run dev` in `frontend` or `backend`. The backend supports `npm start`, `npm run db:setup`, `npm run db:seed`, `npm run db:reset`, and `npm run db:verify`.

## Demo reset

```bash
npm run db:reset
```

This development-only command is restricted to the database named `nfc_business_matching`. It transactionally removes application demo data in foreign-key-safe order and restores one admin, three exhibitors, four visitors, five NFC tags (including both ALT tags), and **zero confirmations**. It never drops the database, modifies MySQL system data, or exposes a reset API.

Development accounts:

| Role | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `admin123` |
| Exhibitor | `exhibitor1` | `exhibitor123` |
| Exhibitor | `exhibitor2` | `exhibitor123` |
| Demo exhibitor | `exhibitor3` | `exhibitor123` |

These credentials are for local development only.

## Demo flow

1. Start XAMPP MySQL, the backend, and the frontend.
2. Log in as `exhibitor3`.
3. Open `http://localhost:5173/company/TES-YHE4QJ`.
4. Confirm Test Company, then view it under **Confirmed Contacts**.
5. Log in as `admin` and view the updated dashboard and confirmation record.

Opening a link or pressing Cancel writes nothing. Confirm creates one `company_saves` row per exhibitor/company; retries are deduplicated.

## Future physical NFC use

A physical tag will contain only a URL such as `https://your-domain.com/company/TES-YHE4QJ`. Do not write passwords, contact records, database data, session information, or other secrets to a tag. Physical tag programming and testing are intentionally outside this prototype.

NFC demo URLs are generated in the browser from `window.location.origin` plus the
stored public token. They therefore use `http://localhost:5173` locally and the
deployed frontend origin on Netlify; the database continues to store only the token.

## Netlify frontend deployment

Netlify is configured by `netlify.toml` to build from `frontend` with
`npm run build` and publish `frontend/dist`. That file proxies `/api/*` to the
hosted backend before applying the SPA fallback, allowing client-side routes
such as `/login`, `/admin`, and
`/company/:token` to be opened directly. For a manual deploy, upload the
contents of `frontend/dist` after running the frontend build.

`VITE_API_URL=http://localhost:3000/api` is suitable only for local development.
Production builds intentionally use same-origin `/api` regardless of this variable,
so remove any old direct-backend value from Netlify. Netlify forwards those requests
to the deployed Render backend according to `netlify.toml`.

## Production readiness

Before deployment:

- Serve frontend and API over HTTPS.
- Use dedicated production database credentials and a strong unique `SESSION_SECRET`.
- Remove or replace all development accounts and passwords.
- Configure `FRONTEND_URL` to the exact production frontend origin so CORS remains restricted.
- Confirm secure cookies are enabled through `NODE_ENV=production` and configure the correct frontend/API domains.
- Use the configured persistent MySQL session store in production.
- Run the API behind a properly configured reverse proxy or supported hosting platform.
- Keep `.env` private; it is already excluded by `.gitignore`.

## Backend Deployment Preparation

Use `backend` as the hosted web service root. Install dependencies with
`npm install` (or `npm ci` for a lockfile-based installation) and start the service
with `npm start`. The backend declares Node.js `22.x`.

Configure these environment variables in the hosting dashboard:

- `NODE_ENV=production`
- `PORT` (normally supplied by the hosting platform)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`
- `DB_SSL` and `DB_SSL_CA_PATH`
- `SESSION_SECRET` set to a strong, unique production value
- `SESSION_STORE=mysql`
- `FRONTEND_URL=https://nfc-business-matching.netlify.app`

The server listens on `0.0.0.0` and the configured `PORT`. `GET /api/health`
checks the Node service without contacting MySQL; `GET /api/db-test` separately
checks database connectivity. Errors returned to clients do not include database
credentials or stack traces.

Production enables Express `trust proxy` and secure `SameSite=Lax` cookies. The
browser calls same-origin `/api`; Netlify proxies it to the hosted API, avoiding
Safari's third-party-cookie restrictions. CORS remains restricted to the exact
`FRONTEND_URL` origin with credentials enabled.

Sessions use `express-mysql-session` and the existing MySQL connection pool. The
store automatically creates a dedicated `sessions` table, keeps records for the
same eight-hour lifetime as the browser cookie, and checks for expired records
every 15 minutes. Application reset commands do not delete this infrastructure
table.

`SESSION_STORE` defaults to `mysql`. Backend startup waits for the store to become
ready and fails clearly if MySQL is unavailable. For UI or health-endpoint work on
a development machine without XAMPP, `SESSION_STORE=memory` may be set explicitly;
this mode loses sessions on restart and is rejected whenever `NODE_ENV=production`.
Production therefore has no MemoryStore fallback.

Some browsers or privacy modes may block cross-site cookies; final authentication
testing must be performed against the actual HTTPS frontend and backend domains.

### Production database initialization

After configuring the target database and its SSL variables, run the utilities
intentionally from `backend`:

```bash
npm run db:setup
npm run db:seed
npm run db:verify
```

`db:setup` only creates missing tables and applies safe missing-column migrations
inside the database selected by `DB_NAME`; it does not create, drop, rename, clear,
or switch databases. The hosted database must already exist. `db:seed` remains a
separate, idempotent demo-data operation and should be run only when demo records
are actually wanted. `db:reset` is strictly development-only and must never be run
against Aiven or any production database.

## Deploy Backend to Render

Create a normal Render Node.js Web Service with these settings:

- **Root Directory:** `backend`
- **Build Command:** `npm ci`
- **Start Command:** `npm start`
- **Health Check Path:** `/api/health`
- **Node version:** `22.x` (declared in `backend/package.json`)

Configure these environment variables in Render. Render supplies `PORT`, so it
does not need to be set manually.

```env
NODE_ENV=production
DB_HOST=<hosted database host>
DB_PORT=3306
DB_NAME=<database name>
DB_USER=<database username>
DB_PASSWORD=<database password>
DB_SSL=true
DB_SSL_CA_PATH=/etc/secrets/aiven-ca.pem
SESSION_SECRET=<strong random secret>
SESSION_STORE=mysql
FRONTEND_URL=https://nfc-business-matching.netlify.app
```

`/api/health` is Render's service health check and intentionally does not contact
MySQL. `/api/db-test` is a separate manual connectivity check. Production startup
waits for the MySQL session store and its `sessions` table before accepting HTTP
requests; it fails instead of falling back to MemoryStore when MySQL is unavailable.
The shared database pool uses at most 10 connections and a 10-second connection
timeout. Render shutdown signals stop new HTTP connections and close the session
store and pool, with a 10-second maximum shutdown window.

For Aiven MySQL, add its CA certificate to Render as a Secret File named
`aiven-ca.pem`. Render exposes that file at `/etc/secrets/aiven-ca.pem`; its contents
come from Aiven's CA certificate field. Set `DB_SSL=true` and
`DB_SSL_CA_PATH=/etc/secrets/aiven-ca.pem`. The backend loads the certificate into
the shared application/session pool and keeps TLS certificate verification enabled.
Startup fails if SSL is enabled without a readable, non-empty CA file. Local XAMPP
continues using `DB_SSL=false` and does not require a certificate.

The deployed backend is `https://nfc-business-matching.onrender.com`. Netlify's
rewrite sends `/api/:splat` to that service's `/api/:splat`. Production frontend
builds always use the same-origin `/api` base, so remove any old hosted-backend
value for `VITE_API_URL` from Netlify (or set it to `/api` for clarity). Local
development may continue using `VITE_API_URL=http://localhost:3000/api`.

## Verification queries

```sql
SELECT id, username, full_name, role, is_active FROM users WHERE role = 'exhibitor';
SELECT id, company_name, company_code, is_active FROM companies;
SELECT c.company_name, n.tag_code, n.public_token, n.is_active FROM nfc_tags n JOIN companies c ON c.id = n.company_id ORDER BY c.company_name;
SELECT cs.id AS record_id, u.username AS exhibitor, c.company_name AS visitor_company, cs.saved_at AS confirmed_at FROM company_saves cs JOIN users u ON u.id = cs.user_id JOIN companies c ON c.id = cs.company_id ORDER BY cs.saved_at DESC;
SELECT c.company_name, COUNT(cs.id) AS confirmations FROM companies c LEFT JOIN company_saves cs ON cs.company_id = c.id GROUP BY c.id, c.company_name ORDER BY confirmations DESC;
```
