# Hosting a small public demo

Checked **2026-10-23**. USD estimates exclude tax, domain, backups and overages unless stated; these are starting prices, not quotes for this three-service stack. Size from measured memory/traffic. Managed platforms build the two Dockerfiles separately and supply `DATABASE_URL`; they generally do not deploy this Compose file directly. Never put the operator secret into frontend build arguments.

| Option | Monthly estimate and official pricing | WebSockets | PostgreSQL option | Sleep / cold-start limits | Setup effort |
| --- | --- | --- | --- | --- | --- |
| Railway | [Hobby $5 minimum, includes $5 usage](https://railway.com/pricing); stack total usage-dependent, unknown | [Supported](https://docs.railway.com/networking/public-networking/specs-and-limits) | Separate metered Postgres service/volume | Optional service sleeping; avoid for predictable live chat | Low: two builds, DB, URLs/env |
| Render | [Pricing](https://render.com/pricing); free demo compute $0 within quota; paid stack total unknown | [Supported](https://render.com/docs/websocket) | Managed Postgres; free DB expires after 30 days | [Free web services sleep after 15 minutes idle; 750 workspace hours/month](https://render.com/docs/free); cold starts disrupt demos | Low–medium |
| Fly.io | [256MB Machine from $2.19/month](https://fly.io/pricing/), region dependent; multiple machines, DB/storage extra; total unknown | [Supported through HTTP service](https://fly.io/docs/networking/services/) | Managed Postgres or self-managed with volume; extra cost | Auto-stop/start configurable; stopped storage still billed | Medium–high |
| Koyeb | [One free 512MB web instance; eco-micro $2.68/month](https://www.koyeb.com/docs/reference/instances); second app and DB extra | [Supported](https://www.koyeb.com/docs/reference/edge-network) | External DB; [free DB only 5 active hours](https://www.koyeb.com/docs/faqs/pricing) | Free service scales to zero after 1 hour; no persistent volumes on free | Medium |
| DigitalOcean VPS + Compose | [2GiB Basic $12/month](https://www.digitalocean.com/pricing/droplets); backup/domain extra; smaller $6/1GiB may be tight during builds | Yes, own reverse proxy | Included Compose Postgres on local disk | No automatic sleep; owner operates uptime/backups | Medium–high: OS patching, firewall, TLS, backup |
| Vercel frontend + separate backend | [Hobby free for personal non-commercial use](https://vercel.com/pricing); backend/DB extra, total unknown | [Vercel Functions cannot serve a WebSocket server](https://vercel.com/docs/limits); use external Nest backend | External | Backend provider controls sleep; frontend public URL must match CORS | Medium: split providers and build env |
| Supabase DB adjunct | [Free $0: 500MB DB; Pro from $25/month](https://supabase.com/pricing) | Nest backend still required; not replaced by DB realtime | Managed PostgreSQL | Free projects pause after a week of inactivity | Medium: connection URL/TLS and migrations |
| Neon DB adjunct | [Free $0 within quotas](https://neon.com/pricing); paid usage-dependent | Nest backend still required | Managed PostgreSQL | [Scale to zero introduces DB wake-up latency](https://neon.com/docs/introduction/scale-to-zero) | Medium: connection URL/TLS and migrations |

For the simplest managed demo, start with Railway Hobby and watch usage: it keeps the two apps and database in one dashboard, but $5 is not a guaranteed total. For a predictable small hosting bill and this exact one-command stack, choose a 2GiB VPS if someone can maintain Linux, TLS and backups; build elsewhere or add memory if builds exceed capacity. Free sleeping tiers are useful for temporary demonstrations, but their pauses, DB expiry and split-provider setup make them poor choices for dependable live support. Keep one Nest instance until distributed presence and rate limits are designed. No services were purchased or deployed for this comparison.

Local Compose and CI at `2692815fe3fd1d229060474ebdb20252a581a112` are verified: 15/15 Jest, 2/2 Playwright and compose-smoke passed ([run](https://github.com/unjica/Live-Chat-Support-Demo/actions/runs/39934401485)). Provider deployments, public TLS and the prices above were not revalidated in P4. Review current provider terms before purchasing. Version 2.0.0 release preparation creates no deployment or release.

## Railway service settings (checked 2026-10-23)

Railway applied only the `build` section of the root `railway.json` for the `backend-v2` service; `deploy.startCommand` and `deploy.preDeployCommand` were ignored, so migrations did not run and Railpack failed with "No start command detected" (the root `package.json` has no `start` script). Configure these on the service itself (Settings → Deploy) instead of relying on config-as-code:

| Setting | Value |
| --- | --- |
| Root directory | `/` |
| Build command | `npm ci --include=dev && npm run build -w backend` |
| Pre-deploy command | `npm run db:migrate -w backend` |
| Start command | `npm start -w backend` (also set variable `RAILPACK_START_CMD=npm start -w backend` for Railpack detection) |
| Healthcheck | path `/`, timeout 120 s |
| Variables | `DATABASE_URL=${{Postgres.DATABASE_URL}}` (private network), `OPERATOR_SECRET`, `FRONTEND_URL`, `HOST=0.0.0.0`, `NODE_ENV=production`, `TRUST_PROXY_HOPS=1` |

`TRUST_PROXY_HOPS=1` matches Railway's single edge proxy, which appends the real client address as the right-most `X-Forwarded-For` entry; the backend uses that entry for the per-IP connection limit and ignores anything further left. Do not expose PostgreSQL through a TCP proxy. The backend sends `X-Content-Type-Options`, `X-Frame-Options: DENY`, a restrictive API `Content-Security-Policy`, `Referrer-Policy`, and HSTS when `NODE_ENV=production`; `X-Powered-By` is disabled.
