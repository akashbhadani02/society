# SocietySetu — MongoDB + GitHub + Vercel

A multilingual (Gujarati / Hindi / English) visitor-management starter for multi-building societies. Includes admin, watchman and resident roles; residents approve/reject visitors; watchmen can record entry only after approval and record exit.

## Important limitations

- This is a deployable starter, not a hosted/production-audited security product.
- WhatsApp button opens a prefilled WhatsApp message. It does **not** send messages automatically. Automatic WhatsApp messages require WhatsApp Business Platform setup and may incur charges.
- In-app requests are stored in MongoDB and appear on refresh; real-time push notifications are not configured.
- Before real society use, add rate limiting, audit logging, backups, monitoring, and have the security workflow reviewed.

## 1. Create a free MongoDB Atlas database

1. Create a MongoDB Atlas account and a free cluster (if the free tier is available in your region).
2. Create a database user with a strong password.
3. In Network Access, allow your development IP. For Vercel, configure access as recommended by Atlas. Avoid opening access broadly unless you understand the risk.
4. Copy the Node.js connection string and replace username/password; use database name `societysetu`.

## 2. Run locally

Install Node.js 20 or later.

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local` and set:
- `MONGODB_URI`
- `JWT_SECRET` to a random secret at least 32 characters long

Create the first admin (it asks for credentials interactively):

```bash
MONGODB_URI="your-mongodb-uri" npm run seed:admin
```

On Windows PowerShell:
```powershell
$env:MONGODB_URI="your-mongodb-uri"
npm run seed:admin
```

Then:
```bash
npm run dev
```

Open http://localhost:3000 and log in as the admin. Use the admin screen to create resident and watchman accounts. Residents must have exact Building and Flat values that match what the watchman enters. For watchmen, fill in their assigned building to restrict them to that building; leave blank only if they are authorized for all buildings.

## 3. Push to GitHub

1. Create a new empty repository on GitHub.
2. Unzip this project, open a terminal in its folder and run:

```bash
git init
git add .
git commit -m "Initial SocietySetu app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Never commit `.env.local` or real passwords. `.gitignore` excludes environment files.

## 4. Deploy to Vercel

1. Import the GitHub repository in Vercel.
2. In Project → Settings → Environment Variables, add `MONGODB_URI` and `JWT_SECRET` for Production (and Preview/Development if needed).
3. Deploy. Vercel detects Next.js automatically.
4. After changing environment variables, redeploy.
5. Create the initial admin securely from your local terminal using the same Atlas `MONGODB_URI`; do not add a public admin-registration endpoint.

## Roles and access rules

- **Admin:** creates accounts; can view society visitors.
- **Watchman:** registers visitors and records entry/exit. A watchman with a configured building can only manage that building.
- **Resident:** only sees and decides visitor requests for their own flat.
- Visitor status starts at `pending`. The server rejects `enter` unless the status is `approved`.
- Session cookie is HTTP-only and expires after 12 hours.

## Notes for 200+ flats

- Create one resident account per flat or household, and use consistent Building / Flat labels (e.g. `A` / `302`).
- Assign each watchman to the building(s) they cover. This starter supports one building assignment per watchman; multiple assignments need a schema extension.
- The resident must be online and log in to see pending requests. Email/web push notifications are not configured yet.
- Database indexes are created for common visitor queries.
- Keep visitor data only as long as required by society policy; collect only information needed for security and protect exports.
