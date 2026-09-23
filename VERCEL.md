# Deploy admin panel on Vercel

## Environment variables

In **Vercel → your project → Settings → Environment Variables**, add:

| Name | Value | Environments |
|------|--------|--------------|
| `VITE_API_BASE_URL` | `http://ivmedizbackend.repsoft.in/api/v1` | Production, Preview, Development |

The admin app is served over **HTTPS** on Vercel. Browsers block direct `http://` API calls (mixed content). **`vercel.json`** rewrites `/api/v1/*` to the EC2 API (`13.207.45.84:3000`). In the browser, requests use **`https://<your-vercel-app>/api/v1`**.

Keep `VITE_API_BASE_URL=http://ivmedizbackend.repsoft.in/api/v1` (or the IP URL) — the client upgrades to the same-origin proxy on HTTPS.

**Infrastructure checklist (EC2):**
- Security group: allow **TCP 3000** (API) from the internet; open **80/443** when using nginx + domain.
- DNS: **A record** `ivmedizbackend.repsoft.in` → Elastic IP (required for mobile app domain URL).

After adding or changing variables, **redeploy** (Deployments → ⋮ → Redeploy). Vite bakes `VITE_*` values in at build time.

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Admin login

With `VITE_API_BASE_URL` set, sign-in calls `POST /auth/admin/login` on your NestJS API. Credentials must match the server `ADMIN_EMAIL` / `ADMIN_PASSWORD` (or an admin user in the database).

On HTTPS (Vercel), the panel uses the `/api/v1` proxy to the backend even when `VITE_API_BASE_URL` is unset. Sign-in always requires the live API.

## CORS

Ensure the API allows your Vercel origin (e.g. `https://your-app.vercel.app`) in `CORS_ORIGIN`, or use `*` for staging.
