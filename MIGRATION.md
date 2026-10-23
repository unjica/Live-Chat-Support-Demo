# Migrating from the Express starter

The NestJS/PostgreSQL migration is a breaking change. Version 2.0.0 packages this migration; release notes are a draft and no release or tag is created.

1. Back up your project and existing browser history if needed. Old localStorage/sessionStorage histories are not imported; the new database starts empty. Keep the old application available separately if you need its history.
2. Install Node 22+ and run `npm ci` from the repository root. The root lockfile/workspaces replace separate installs. Backend source is now TypeScript in `backend/src`, compiled to `backend/dist`; Express entry points are removed.
3. Provision PostgreSQL, configure `backend/.env` from the example, and generate a private 32+ character `OPERATOR_SECRET`. Previously implicit operator access now requires login. Do not reuse public example secrets.
4. Run `npm run prisma:generate -w backend` and `npm run db:migrate -w backend`. Use `prisma migrate deploy` on each deployment, not development migrations or schema reset.
5. Set `FRONTEND_URL` to exact allowed origins and frontend `NEXT_PUBLIC_API_URL` to the backend origin before building. Ports default to frontend 3000/backend 3001; `HOST` defaults to all interfaces. Restrict network access and use TLS in hosted environments.
6. Run root lint/typecheck/build, Jest with a dedicated migrated test database, and Playwright; then start both services. One-command development is `npm run dev`; `docker compose -f compose.dev.yaml up -d --wait postgres` supplies PostgreSQL for native development; `docker compose up --build -d --wait` runs the full stack after configuring the root `.env`.

## Socket clients and templates

Event names `user_join`, `send_message`, `typing_start`, `typing_stop`, and `receive_message` remain, but their payloads and authentication contract changed. `user_join` accepts `{role:"visitor", token?}` or `{role:"admin", secret}` and acknowledges a server-issued identity/history/token. Client-selected sender IDs/roles are rejected. `send_message` requires `conversationId`, UUID `clientMessageId` and `content`; preserve the client ID when retrying an unacknowledged send. History uses `select_conversation`; online lists use `visitors_online`. See [protocol documentation](docs/diploma/socket-events.md).

Reconnect must authenticate again and restore server history. Visitor credentials expire after 30 days; expired/unknown credentials receive `UNAUTHORIZED`, after which the bundled client requests a fresh conversation once. This does not import the expired conversation. Operator secrets remain only in memory on the client; reload requires login again. Server restart preserves database history but clears presence.

Do not scale to multiple backend replicas without shared room/presence/abuse state. Existing custom clients must adopt the new acknowledgements, error handling and credential storage before upgrading.

Validation at `2692815fe3fd1d229060474ebdb20252a581a112`: 15/15 Jest, 2/2 Playwright and compose-smoke passed ([CI](https://github.com/unjica/Live-Chat-Support-Demo/actions/runs/39934401485)). Current audit: 39 findings (37 high, 2 moderate); see [security analysis](docs/diploma/security-audit.md). See [CHANGELOG](CHANGELOG.md) and [draft release notes](RELEASE_NOTES_v2.0.0.md).
