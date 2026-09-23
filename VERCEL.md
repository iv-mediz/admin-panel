# Deploy admin panel on Vercel

## Environment variables

In **Vercel → your project → Settings → Environment Variables**, add:

| Name | Value | Environments |
|------|--------|--------------|
| `VITE_API_BASE_URL` | `http://ivmedizbackend.repsoft.in/api/v1` | Production, Preview, Development |

Use `https://…` when TLS is enabled on the API host.

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
