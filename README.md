# Live Chat Support Demo

An MIT-licensed live support starter with a Next.js/React visitor widget and operator inbox, a NestJS/Socket.IO backend, and PostgreSQL persistence through Prisma. Conversations are isolated on the server, visitor credentials are hashed in storage, and message IDs make retries idempotent. Reconnect restores history without refreshing the page.

Create your own project with [Use this template](https://github.com/unjica/Live-Chat-Support-Demo/generate). The original starter was [featured on Dev.to](https://dev.to/unjica/live-chat-support-starter-kit-open-source-79h).

**Upgrading from the Express version? Read [MIGRATION.md](MIGRATION.md).** PostgreSQL and operator authentication are now required; the socket payloads changed.

## Docker quick start

Requires Docker Engine/Desktop with Docker Compose v2+ (including `--wait`). No host Node.js or PostgreSQL installation is needed.

```sh
cp .env.example .env
# Set OPERATOR_SECRET in .env to the output of: openssl rand -hex 32
docker compose up --build -d --wait
```

Open http://localhost:3000/visitor and http://localhost:3000/admin. Log in as operator using `OPERATOR_SECRET` from `.env`. Use separate browser profiles for independent visitors. The backend health endpoint is http://localhost:3001/; frontend health uses `/`. PostgreSQL is private to the Compose network. All application containers run as a non-root user; the one-shot migration service must succeed before the backend starts. Missing/short/example operator secrets fail startup in production.

`docker compose up` starts the same stack after initial configuration/build. `docker compose logs -f` shows logs; `docker compose down` stops/removes containers and keeps the named database volume. **`docker compose down -v` permanently deletes local chat data.** Do not run it against data you need.

`NEXT_PUBLIC_API_URL` is a browser-reachable URL, never the internal `backend` service name. It is a Docker build argument embedded into JavaScript; changing it requires `docker compose up --build -d`. Set `FRONTEND_URL` to the exact frontend browser origin (including scheme/port). Change both URLs if changing public ports/domains. Root `.env` configures Compose; native workspace env files are excluded from images.

### Self-hosting

Use one backend replica. Set a random operator secret and URL-safe database password before first startup. Keep `.env` private. A password change on an existing PostgreSQL volume requires changing the database role password too; environment variables do not reset existing credentials.

Place a TLS reverse proxy (Caddy/nginx/Traefik) in front of both origins, use HTTPS for `NEXT_PUBLIC_API_URL` and `FRONTEND_URL`, and rebuild. For nginx, forward `/socket.io/` to backend port 3001 with HTTP/1.1, `Upgrade $http_upgrade`, `Connection "upgrade"`, `Host $host`, and a sufficiently long `proxy_read_timeout` (e.g. 120s). Forward normal frontend requests to port 3000. Configure edge connection/rate limits. Loopback port binding works with a host proxy; for a container proxy, attach it to the Compose network and route directly to services, or explicitly choose `BIND_ADDRESS` with appropriate firewall rules. Do not expose PostgreSQL.

Back up regularly, copy backups off-host and test restoration:

```sh
docker compose exec -T postgres pg_dump -U chat -d chat -Fc > chat.dump
# Restore only into an intended empty database:
# docker compose exec -T postgres pg_restore -U chat -d chat < chat.dump
```

To update, back up first, pull reviewed source changes, then run `docker compose up --build -d --wait`. Migrations run before backend startup; review schema changes and recovery plans before updating a live instance. Existing dependency/security limits still apply. See [hosting options and pricing sources](docs/hosting.md) and the [v2.0 release procedure](docs/release-v2.md).

## Native development quick start

Requires Node.js 22+ (CI uses 22), npm and Docker Compose or PostgreSQL 16. Ports 3000, 3001 and 5432 must be free for these defaults; if PostgreSQL is already installed, use a dedicated local database and update `DATABASE_URL` instead of starting Compose.

```sh
npm ci
npm run prisma:generate -w backend
docker compose -f compose.dev.yaml up -d --wait postgres
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Set OPERATOR_SECRET in backend/.env to a random secret of at least 32 characters.
# Generate one with: openssl rand -hex 32
npm run db:migrate -w backend
npm run dev
```

Open http://localhost:3000/visitor and http://localhost:3000/admin. Enter the backend operator secret in the operator login form. Use separate browser profiles for independent visitors; duplicated tabs share localStorage and the same conversation. `npm run dev` starts both workspaces. If a restricted environment reports Watchpack `EMFILE`, use `WATCHPACK_POLLING=true npm run dev`. The explicit `compose.dev.yaml` file starts only PostgreSQL, bound to loopback with a persistent volume; its example credentials are for local development.

## Configuration

Backend workspace scripts load `backend/.env`. Frontend loads `frontend/.env.local`.

| Variable | Native default / purpose |
| --- | --- |
| `DATABASE_URL` | Required PostgreSQL URL; example uses localhost:5432/chat. Use a separate test database. |
| `OPERATOR_SECRET` | Required 32+ characters; server only, entered at login. Rotate and restart to end existing sessions. |
| `FRONTEND_URL` | Exact allowed origins, comma-separated; development default http://localhost:3000, required in production. Non-browser clients may omit Origin but still authenticate. |
| `PORT` / `HOST` | Backend 3001 / 0.0.0.0. |
| `CLIENT_IP_HEADER` | Optional single-value client IP header set by a trusted edge, default empty (disabled). On Railway set `x-real-ip`: the Railway edge overwrites `X-Real-IP` and `X-Forwarded-For` on every public request, and its `X-Forwarded-For` may contain an extra internal hop, so hop counting is unreliable there. Requests over Railway private networking bypass the edge, so only enable this when no untrusted service can reach the backend privately. Invalid values fall back to `TRUST_PROXY_HOPS`/socket peer. |
| `TRUST_PROXY_HOPS` | Number of trusted reverse proxies in front of the backend (0–10), default 0 = use the socket peer address and ignore `X-Forwarded-For`. Set 1 behind a single nginx/Caddy that appends `X-Forwarded-For`. Never set it higher than the real number of proxies, otherwise clients can spoof their IP and bypass the per-IP connection limit. |
| `NEXT_PUBLIC_API_URL` | Browser backend origin, default http://localhost:3001; embedded at build time. |
| `NEXT_PUBLIC_SITE_URL` | Optional public frontend origin (e.g. https://live-chat.tacko.io) used as `metadataBase` for absolute OG/Twitter image URLs; embedded at build time. |
| `POSTGRES_PASSWORD` | Compose DB password; local example only. Use URL-safe hex before hosting. |
| `BIND_ADDRESS` | Compose published app interface, default 127.0.0.1. |
| `FRONTEND_PORT` / `BACKEND_PORT` | Compose published app ports, default 3000 / 3001; also update browser URLs when changing. |

Visitor bearer tokens live in localStorage (migrated from older sessionStorage builds) and expire 30 days after conversation creation. Shared computers: use End chat to clear the token. Closing a tab no longer starts a new conversation on return. Expired tokens start a new conversation; old history stays in the database and is not automatically deleted. Use HTTPS/WSS outside localhost. Never commit `.env` files or log credentials.

The UI includes typing indicators, connection status, unread notifications and dark mode. Customize the greeting and agent name in `frontend/src/config/chat.ts`; styles use Tailwind CSS.

## Architecture and scripts

`frontend/src` contains App Router pages, chat components and Zustand state. `backend/src` contains the Nest module, validated socket gateway, authorization and persistence services. `backend/prisma` contains the schema and deployable migration. Visitors join only their own conversation room; authenticated operators receive all conversations. Messages use server identity/time and database sequence ordering.

```sh
npm run lint
npm run typecheck
npm run build
npm start -w backend
npm start -w frontend
```

The backend root `GET /` checks the database and returns `{"status":"ok"}` or a generic HTTP 503. Shutdown hooks disconnect Prisma. Runtime logs use Nest JSON output. Socket errors expose generic replies and log sanitized exception class/stack locations without payloads or raw exception messages.

## Tests

Create a dedicated `chat_test` database first (with the native development database running):

```sh
docker compose -f compose.dev.yaml exec -T postgres createdb -U chat chat_test
```

Run this once for a fresh development volume. Tests clean only their own conversations. Never point these commands at production.

```sh
export DATABASE_URL=postgresql://chat:chat@127.0.0.1:5432/chat_test
export OPERATOR_SECRET=local-test-only-secret-at-least-32-characters
npm run db:migrate -w backend
npm test
NEXT_PUBLIC_API_URL=http://127.0.0.1:43101 npm run build
npx playwright install chromium
npm run test:e2e
```

Jest uses real PostgreSQL and Socket.IO clients for isolation, authorization, retries, restart/history, validation, expiry and abuse checks. Playwright checks two-way display, ordering, focus, reconnect without reload and stale-token recovery. CI runs all checks with PostgreSQL 16 and Chromium. Detailed evidence lives in [the Slovenian thesis testing notes](docs/diploma/testing.md).

## Deployment and limits

Build both workspaces, set backend environment variables, run `npm run db:migrate -w backend` before starting the backend, and serve the frontend with its API origin set at build time. `railway.json` includes a pre-deploy migration and DB health check; `frontend/vercel.json` configures the frontend workspace. See [deployment notes](docs/diploma/deployment.md) and the [v2.0 release procedure](docs/release-v2.md) for live-chat.tacko.io. No deployment is performed by these instructions.

This version supports one backend instance and a shared operator credential. Basic controls allow 60 handshakes per peer IP/minute, 5 join attempts per socket/minute, 120 other events per socket/minute, 16 KiB socket payloads and 4,000-character messages. Behind a proxy the peer is the proxy; configure trusted client-IP limits and active-connection caps at the edge. Reconnecting can bypass per-socket limits. These controls are not distributed protection. History/list pagination, retention, individual operator accounts and multi-instance presence need further work ([issue #5](https://github.com/unjica/Live-Chat-Support-Demo/issues/5)). Review [remaining dependency findings](docs/diploma/security-audit.md) before public use.

## Contributing and license

Contributions are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md) and [CHANGELOG.md](CHANGELOG.md). The original project is by **Sanja Malović**, under the [MIT license](LICENSE). Thesis architecture, methodology and evidence remain separately documented in Slovenian under [docs/diploma](docs/diploma).

Version **2.0.0** is prepared, unreleased; see [draft release notes](RELEASE_NOTES_v2.0.0.md). Verified CI at `2692815fe3fd1d229060474ebdb20252a581a112`: **15/15 Jest**, **2/2 Playwright**, **compose-smoke passed** ([run](https://github.com/unjica/Live-Chat-Support-Demo/actions/runs/39934401485)); Docker also verified locally. Audit on 2026-10-23: **39 findings (37 high, 2 moderate)**. Final preparation changes require a new CI run after runner publication.
