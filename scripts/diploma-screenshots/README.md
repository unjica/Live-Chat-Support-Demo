# Diploma screenshots

```bash
# Isolated local stack must be running (frontend :3000, backend :3001).
# Use a generated local OPERATOR_SECRET — never the production secret.
export OPERATOR_SECRET="$(openssl rand -hex 32)"
export BASE_URL=http://127.0.0.1:3000
export DATABASE_URL=postgresql://chat@127.0.0.1:55432/diploma_gradivo
node scripts/diploma-screenshots/capture.mjs
```

Outputs to `docs/diploma/gradivo/screenshots/`. Hides SocketInitializer and Next.js dev badges via injected CSS. Truncates the local diploma DB between preliminary and scenario shots.
