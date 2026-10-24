# Releasing v2.0 at live-chat.tacko.io

Checked 2026-10-24. Target: frontend `https://live-chat.tacko.io` (Vercel), backend `https://backend-v2-production-1ea6.up.railway.app` (Railway `backend-v2`). The v1 demo (`live-chat-support-demo.vercel.app` and its Railway backend) stays online until v2 is verified.

## Current state

- `live-chat.tacko.io` is a CNAME to `cname.vercel-dns.com` and is served by the same Vercel project and **Production** deployment as `live-chat-support-demo.vercel.app` (same deployment id and ETag). It therefore shows the v1 frontend and talks to the v1 backend. DNS needs no change.
- `vercel.json` disables automatic deploys from `main`; nothing is published by merging.
- `backend-v2` CORS (`FRONTEND_URL`) allows exactly `https://live-chat-support-demo.vercel.app,https://live-chat.tacko.io`. No wildcard.

## Procedure

1. **Back up the v2 database** (Railway Postgres backup or `pg_dump` from inside the private network). Do not change passwords.
2. **Vercel → Project → Settings → Environment Variables**, environment **Preview**, branch `release/v2`, and also **Production**:
   - `NEXT_PUBLIC_API_URL=https://backend-v2-production-1ea6.up.railway.app`
   - `NEXT_PUBLIC_SITE_URL=https://live-chat.tacko.io`
   Never add `OPERATOR_SECRET` or `DATABASE_URL` to Vercel. The values are embedded at build time, so a rebuild is required after changes.
3. **Build a v2 preview.** Push `main` to branch `release/v2`. Check the preview while signed in to Vercel (it is protected by Vercel Authentication).
4. **Publish.** On the verified `release/v2` deployment, choose **⋯ → Promote to Production**. This rebuilds the deployment with Production variables and moves both production domains to v2. The v1 URL keeps working against `backend-v2` because its origin is allowed.
5. **Verify** (the secret is read from a file and never printed):
   ```bash
   SITE_URL=https://live-chat.tacko.io API_URL=https://backend-v2-production-1ea6.up.railway.app \
   OPERATOR_SECRET_FILE=/path/to/operator-secret node scripts/verify-deployment.cjs
   ```
6. **If anything fails:** Vercel → Deployments → previous production deployment → **Instant Rollback**. The v1 Railway backend is untouched.
7. **Clean up test data** after a fresh backup: delete only the conversations whose messages start with `verify-` or were created during testing.
8. Only after a stable period, with separate approval: create GitHub release `v2.0.0` and retire the v1 backend.

If you want `live-chat.tacko.io` on v2 while `live-chat-support-demo.vercel.app` stays on v1, assign the domain to Git branch `release/v2` (Settings → Domains → Edit). That turns it into a preview domain, which Vercel Authentication blocks for the public unless you add a Deployment Protection exception. That exception is a paid Pro add-on on Vercel.
