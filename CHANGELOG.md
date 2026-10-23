# Changelog

All notable changes are documented here following Keep a Changelog and Semantic Versioning.

## [2.0.0] - Unreleased

### Breaking

- Replace the 1.x Express backend and browser-only history with NestJS/Prisma and required PostgreSQL; no automatic import of old browser history.
- Require operator login and server-issued visitor identity. Custom Socket.IO clients must adopt the new payloads, acknowledgements and credential handling; see [MIGRATION.md](MIGRATION.md).
- Use root npm workspaces/lockfile and Node.js 22+; replace the old DB-only Compose filename with explicit `compose.dev.yaml`.

### Added

- Persistent isolated conversations, ordered/idempotent messages and reconnect/restart history.
- Real-PostgreSQL Jest tests, two browser scenarios, CI and full non-root Docker Compose stack with migration/health gates.
- English self-hosting/migration guidance and separate Slovenian thesis evidence.

### Changed

- Server controls sender identity, timestamps and room membership; operator selects a conversation for history/replies.
- Root `npm run dev` starts both apps; full Compose starts both apps and private PostgreSQL.
- All workspace versions are 2.0.0. [Release notes](RELEASE_NOTES_v2.0.0.md) remain a draft.

### Security

- Hash visitor credentials; expire them after 30 days. Validate payloads, origins and production configuration; limit basic handshake/join/event abuse.
- Add DB-aware generic health errors, sanitized socket logging and shutdown hooks; update compatible PostCSS dependency.
- Audit on 2026-10-23: 39 findings (37 high, 2 moderate); known dependency and shared-secret/single-instance limits remain in [security-audit.md](docs/diploma/security-audit.md) and issues #4/#5.

Evidence before this release preparation: `2692815fe3fd1d229060474ebdb20252a581a112`, [CI](https://github.com/unjica/Live-Chat-Support-Demo/actions/runs/39934401485), 15/15 Jest, 2/2 Playwright and compose-smoke passed. Final release-preparation CI must be checked after publication. No tag, release or deployment is created here.
