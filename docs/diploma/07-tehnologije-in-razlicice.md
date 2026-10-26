# 7. Tehnologije in različice

Različice so razrešene iz korenskega `package-lock.json` (commit `1114039`, monorepo `2.0.0`).

| Področje | Paket / orodje | Različica |
| --- | --- | --- |
| Frontend ogrodje | next | 15.5.28 |
| | react, react-dom | 19.1.0 |
| Stanje | zustand | 5.0.3 |
| Slog | tailwindcss | 3.4.19 |
| Realni čas (odjemalec) | socket.io-client | 4.8.1 |
| Backend ogrodje | @nestjs/core, common, websockets, platform-socket.io, platform-express | 11.2.7 |
| Konfiguracija | @nestjs/config | 4.0.4 |
| Realni čas (strežnik) | socket.io | 4.8.3 |
| Validacija | class-validator / class-transformer | 0.14.4 / 0.5.1 |
| ORM | prisma, @prisma/client | 6.19.3 |
| Jezik | typescript | 5.8.3 |
| Testi | jest / ts-jest | 29.7.0 / 29.4.15 |
| E2E | @playwright/test | 1.64.1 |
| Lint | eslint | 9.39.5 |

| Okolje | Različica | Vir |
| --- | --- | --- |
| Node.js (CI, Docker) | 22 (`node:22-bookworm-slim`, `actions/setup-node` 22) | `backend/Dockerfile`, `frontend/Dockerfile`, `ci.yml` |
| Node.js (lokalne meritve 26. 10.) | 22.23.4 | |
| PostgreSQL (Compose, CI) | 16 (`postgres:16-alpine`) | `compose.yaml`, `ci.yml` |
| PostgreSQL (Railway backend-v2) | 18 | Railway storitev |
| PostgreSQL (lokalni testi in meritve 26. 10.) | 18.6 | |
| Gostovanje | Vercel (frontend), Railway (backend, baza) | |
