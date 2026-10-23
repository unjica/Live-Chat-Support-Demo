# Changelog

## Unreleased — breaking migration (recommended v2.0.0)

- Replace Express/global broadcasts and browser-only history with NestJS, Socket.IO, Prisma 6 and required PostgreSQL.
- Require server-verified operator authentication and server-issued, hashed visitor tokens; isolate conversation rooms and expire visitor credentials after 30 days.
- Persist ordered messages, deduplicate retries, restore history on reconnect/restart, validate payloads and limit basic connection/event abuse.
- Add database-aware health checks, shutdown hooks, startup validation, migration deployment configuration and workspace scripts.
- Add PostgreSQL integration tests, Playwright scenarios and GitHub Actions CI; document setup, audit findings and migration steps.

See MIGRATION.md before upgrading. No release or deployment has been created.
