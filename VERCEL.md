# Deploy admin panel on Vercel

## Environment variables

In **Vercel → your project → Settings → Environment Variables**, add:

| Name | Value | Environments |
|------|--------|--------------|
| `VITE_API_BASE_URL` | `http://ivmedizbackend.repsoft.in/api/v1` | Production, Preview, Development |

The admin app is served over **HTTPS** on Vercel. Browsers block direct `http://` API calls (mixed content). This repo includes **`vercel.json`** rewrites so the panel calls **`/api/v1/...` on the same origin** and Vercel proxies to the backend. You can keep the env var as `http://ivmedizbackend.repsoft.in/api/v1`; in the browser it automatically uses the HTTPS proxy.

Optional later: enable TLS on the API host and set `https://ivmedizbackend.repsoft.in/api/v1`.

After adding or changing variables, **redeploy** (Deployments → ⋮ → Redeploy). Vite bakes `VITE_*` values in at build time.

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Admin login

With `VITE_API_BASE_URL` set, sign-in calls `POST /auth/admin/login` on your NestJS API. Credentials must match the server `ADMIN_EMAIL` / `ADMIN_PASSWORD` (or an admin user in the database).

Without `VITE_API_BASE_URL`, the panel stays in **UI-only demo mode** (mock sign-in).

## CORS

Ensure the API allows your Vercel origin (e.g. `https://your-app.vercel.app`) in `CORS_ORIGIN`, or use `*` for staging.
