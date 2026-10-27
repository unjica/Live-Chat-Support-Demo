# Lokalni zagon testov (27. 10. 2026, Europe/Ljubljana)

Izoliran strežnik PostgreSQL na `127.0.0.1:55432`, baza `diploma_e2e`, lokalni `OPERATOR_SECRET` (ni produkcijski). Produkcije (Vercel, Railway backend-v2) **nismo** spreminjali.

| Sklop | Rezultat | Čas (CET) |
| --- | --- | --- |
| Jest (`npm test -w backend`) | **2** suite, **30** testov, vsi uspešni | 12:57 |
| Playwright (`npx playwright test`) | **3** testa, vsi uspešni | 12:58 |

Surovi izhodi: [jest-2026-10-27.txt](jest-2026-10-27.txt), [playwright-2026-10-27.txt](playwright-2026-10-27.txt).

Playwright scenariji:

1. `H3: ordered two-way display and reconnect without page reload`
2. `expired visitor token recovers with a new conversation`
3. `admin sort, mark-read persists, leave notice, visitor localStorage return`

Posnetki zaslona: skript `scripts/diploma-screenshots/capture.mjs` proti lokalnemu `dev` skladu (`diploma_gradivo`), ločenemu od e2e baze.
