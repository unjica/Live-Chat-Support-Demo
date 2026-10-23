# Live Chat Support Demo

An MIT-licensed live support starter with a Next.js/React visitor widget and operator inbox, a NestJS/Socket.IO backend, and PostgreSQL persistence through Prisma. Conversations are isolated on the server, visitor credentials are hashed in storage, and message IDs make retries idempotent. Reconnect restores history without refreshing the page.

Create your own project with [Use this template](https://github.com/unjica/Live-Chat-Support-Demo/generate). The original starter was [featured on Dev.to](https://dev.to/unjica/live-chat-support-starter-kit-open-source-79h).

**Upgrading from the Express version? Read [MIGRATION.md](MIGRATION.md).** PostgreSQL and operator authentication are now required; the socket payloads changed.

## Quick start

Requires Node.js 22+ (CI uses 22), npm and Docker Compose or PostgreSQL 16.

```sh
npm ci
npm run prisma:generate -w backend
docker compose up -d postgres
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Set OPERATOR_SECRET in backend/.env to a random secret of at least 32 characters.
# Generate one with: openssl rand -hex 32
npm run db:migrate -w backend
npm run dev
```

Open http://localhost:3000/visitor and http://localhost:3000/admin. Enter the backend operator secret in the operator login form. Use separate browser profiles for independent visitors; duplicated tabs can inherit sessionStorage. `npm run dev` starts both workspaces. Compose starts only PostgreSQL, bound to loopback with a persistent volume; its example credentials are for local development.

## Configuration

Backend workspace scripts load `backend/.env`. Frontend loads `frontend/.env.local`.

- `DATABASE_URL`: PostgreSQL connection URL; use a separate database for tests.
- `OPERATOR_SECRET`: 32+ characters; kept on the server and entered at operator login, never in `NEXT_PUBLIC_*`. Shared by operators; rotate it and restart the server to terminate existing sessions.
- `FRONTEND_URL`: comma-separated exact allowed browser origins, default http://localhost:3000 in development. Required in production. Origin checks supplement authentication; non-browser clients can omit Origin.
- `PORT` / `HOST`: backend defaults 3001 / 0.0.0.0.
- `NEXT_PUBLIC_API_URL`: public backend origin, default http://localhost:3001; embedded in the frontend at build time.

Visitor bearer tokens live in sessionStorage and expire 30 days after conversation creation. Expired tokens start a new conversation; old history stays in the database and is not automatically deleted. Use HTTPS/WSS outside localhost. Never commit `.env` files or log credentials.

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

Create a dedicated `chat_test` database first. Tests clean only their own conversations. Never point these commands at production.

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

Build both workspaces, set backend environment variables, run `npm run db:migrate -w backend` before starting the backend, and serve the frontend with its API origin set at build time. `railway.json` includes a pre-deploy migration and DB health check; `frontend/vercel.json` configures the frontend workspace. See [deployment notes](docs/diploma/deployment.md). No deployment is performed by these instructions.

This version supports one backend instance and a shared operator credential. Basic controls allow 60 handshakes per peer IP/minute, 5 join attempts per socket/minute, 120 other events per socket/minute, 16 KiB socket payloads and 4,000-character messages. Behind a proxy the peer is the proxy; configure trusted client-IP limits and active-connection caps at the edge. Reconnecting can bypass per-socket limits. These controls are not distributed protection. History/list pagination, retention, individual operator accounts and multi-instance presence need further work ([issue #5](https://github.com/unjica/Live-Chat-Support-Demo/issues/5)). Review [remaining dependency findings](docs/diploma/security-audit.md) before public use.

## Contributing and license

Contributions are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md) and [CHANGELOG.md](CHANGELOG.md). The original project is by **Sanja Malović**, under the [MIT license](LICENSE). Thesis architecture, methodology and evidence remain separately documented in Slovenian under [docs/diploma](docs/diploma).
