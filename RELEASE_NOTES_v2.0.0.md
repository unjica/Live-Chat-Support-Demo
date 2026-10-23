# v2.0.0 — draft release notes

A persistent live-support starter with Next.js, NestJS, Socket.IO and PostgreSQL, preserving the MIT license and Sanja Malović’s authorship.

## Upgrade warning

This is a breaking upgrade from 1.x Express. PostgreSQL and operator authentication are required; old browser history is not imported. Custom clients must adopt server-issued identity, conversation IDs, UUID retry IDs and the acknowledgement protocol. Read [MIGRATION.md](MIGRATION.md) before upgrading, back up existing data and test in a separate environment.

## Included

- Server-isolated visitor conversations and targeted operator replies/typing.
- Ordered persistent messages, idempotent retries and reconnect/restart history.
- 30-day visitor credentials, hashed storage, input/origin checks and basic abuse limits.
- Full non-root Docker Compose self-hosting with private DB, healthchecks and migrations; native npm development remains supported.
- Real database integration tests, browser tests and Compose CI.

## Validation and limits

Published implementation `2692815fe3fd1d229060474ebdb20252a581a112` passed 15/15 Jest, 2/2 Playwright and compose-smoke in [CI](https://github.com/unjica/Live-Chat-Support-Demo/actions/runs/39934401485). Docker was also verified locally. Final release-preparation CI remains required after publication.

Audit on 2026-10-23: 39 package findings (37 high, 2 moderate; no critical/low). Known toolchain advisories remain; see [security audit](docs/diploma/security-audit.md) and issue #4. This version uses one backend instance and a shared operator secret. Pagination, retention, individual accounts and distributed protection remain in issue #5. Configure TLS, private credentials, backups and edge limits before public hosting.

These notes are ready for review; no tag, GitHub release or deployment has been created.
