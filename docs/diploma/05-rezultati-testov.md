# 5. Rezultati testov

Legenda: **Preverjeno** pomeni, da je bil test dejansko izveden in je zapisan rezultat. Navedeni so datum, commit in način.

**Tri ločene kategorije preverjanja** (ne mešati rezultatov):

| Kategorija | Kaj meri | Kje so dokazi |
| --- | --- | --- |
| **A. Avtomatizirani testi** | Jest (enota/integracija), Playwright (brskalnik), CI `validate` + `compose-smoke` | ta poglavje §5.1–5.2; [gradivo/testing/](gradivo/testing/) |
| **B. Lokalni obremenitveni / zakasnitveni bench** | Loopback meritev zakasnitve in 100 sočasnih obiskovalcev | §5.5; [06-dokazi-hipotez.md](06-dokazi-hipotez.md); `rezultati/bench-2026-10-26-*.json` |
| **C. Produkcijsko preverjanje** | Gostovani backend-v2 (+ frontend na javnih domenah) | §5.3, §5.6; [gradivo/testing/pregled-testov.md](gradivo/testing/pregled-testov.md) |

Bench **ni** CI in **ni** produkcijska meritev. Produkcijski socket E2E **ni** zamenjava za Jest/Playwright.

## 5.1 Avtomatizirani testi — lokalni zagon

### 5.1.1 Stanje po UX v2 (27. 10. 2026)

Okolje: izoliran PostgreSQL na `127.0.0.1` (baza ločena od produkcije), lokalni `OPERATOR_SECRET` (ni produkcijski). Produkcije nismo spreminjali.

| Korak | Rezultat | Dokaz |
| --- | --- | --- |
| Jest (`npm test -w backend`) | **2** suite, **30/30** uspešnih | [gradivo/testing/jest-2026-10-27.txt](gradivo/testing/jest-2026-10-27.txt), [izvedba-lokalno.md](gradivo/testing/izvedba-lokalno.md) |
| Playwright (`npm run test:e2e`) | **3/3** uspešnih | [gradivo/testing/playwright-2026-10-27.txt](gradivo/testing/playwright-2026-10-27.txt) |

Playwright scenariji (27. 10.):

1. `H3: ordered two-way display and reconnect without page reload`
2. `expired visitor token recovers with a new conversation`
3. `admin sort, mark-read persists, leave notice, visitor localStorage return`

Jest: 17 testov v `backend/test/chat.spec.ts` (vključno z razvrščanjem, `operatorLastReadSequence`, `visitor_presence`) + 13 v `backend/test/security.spec.ts` (`it`/`describe`). Razlika od 28 (26. 10.) = 2 nova testa iz PR #15.

Ponovno potrjeno ob preverjanju dokumentacije (27. 10. 2026, Europe/Ljubljana): **30/30** Jest, **3/3** Playwright na ločeni bazi `chat_verify` (isti izvor kode kot `main`).

### 5.1.2 Prejšnji lokalni zagon (26. 10. 2026, commit `1114039`)

Okolje: Linux x64, Node v22.23.4, PostgreSQL 18.6 (`chat_test`), Chromium iz Playwright 1.64.1.

| Korak | Ukaz | Rezultat |
| --- | --- | --- |
| Namestitev | `npm ci` | uspešno |
| Migracija | `npm run db:migrate -w backend` | »All migrations have been successfully applied.« |
| Lint + typecheck | `npm run lint && npm run typecheck` | izhod 0 |
| Build | `NEXT_PUBLIC_API_URL=http://127.0.0.1:43101 npm run build` | izhod 0 (Next.js 15.5.28) |
| Jest | `npm test` | **2/2 zbirki, 28/28 testov** ([izpis](rezultati/jest-2026-10-26.txt)) |
| Playwright | `npm run test:e2e` | **2/2** (brez admin UX scenarija, ki je prišel z PR #15) |

## 5.2 CI (GitHub Actions, `.github/workflows/ci.yml`)

Opravili `validate` (Node 22, PostgreSQL 16: lint, typecheck, build, pregled bundla, Jest, Playwright) in `compose-smoke` (celoten Docker sklad, HTTP, avtentikacija, dva izolirana obiskovalca, štiri sporočila).

| Datum | Commit | Run | Rezultat |
| --- | --- | --- | --- |
| 23. 10. 2026 | `2692815` | [39934401485](https://github.com/unjica/Live-Chat-Support-Demo/actions/runs/39934401485) | uspešno (15/15 Jest, 2/2 Playwright, compose-smoke) |
| 24. 10. 2026 | `a9c2eaf` (PR #11) | [40087963202](https://github.com/unjica/Live-Chat-Support-Demo/actions/runs/40087963202) | uspešno |
| 24. 10. 2026 | `fd4f93e` (PR #12) | [40088239449](https://github.com/unjica/Live-Chat-Support-Demo/actions/runs/40088239449) | uspešno |
| 24. 10. 2026 | `1114039` (PR #13) | [40091092474](https://github.com/unjica/Live-Chat-Support-Demo/actions/runs/40091092474) | uspešno |
| 24. 10. 2026 | `ce25e05` (`release/v2`) | [40091894041](https://github.com/unjica/Live-Chat-Support-Demo/actions/runs/40091894041) | uspešno |
| 27. 10. 2026 | PR #15 / #16 na `main` | glej Actions ob združitvi | uspešno (CI mora biti zelen pred združitvijo) |

## 5.3 Preverjanje gostovanega backend-v2 (Railway, 23.–24. 10. 2026)

Izvedeno z Node Socket.IO odjemalcem in `curl` proti `https://backend-v2-production-1ea6.up.railway.app` (commita `5a18402`/`9a1f67e`). Skrivnost je bila brana iz datoteke in ni bila izpisana. Večino preverjanj je avtomatiziral `scripts/verify-deployment.cjs`.

| Preverjanje | Rezultat | Način |
| --- | --- | --- |
| HTTPS / TLS, health `GET /` | 200 `{"status":"ok"}` | curl |
| WSS povezava | uspešna | socket.io-client, transport websocket |
| Celoten krog obiskovalec → operater → obiskovalec | uspešen | Node skript (zadnjič 24. 10. 2026 z Origin aliasa predogleda) |
| Izolacija dveh obiskovalcev | brez uhajanja; tuje pošiljanje zavrnjeno | verify skript |
| Reconnect z zgodovino | zgodovina obnovljena | verify skript |
| Zgodovina po ponovni namestitvi in po ponovnem zagonu baze | ohranjena | ročni redeploy in restart, nato branje zgodovine |
| CORS, točno ujemanje | dovoljeni izvori 200; `https://evil.example`, `https://chat.tacko.io`, unikatni URL predogleda 403 | curl na `/socket.io/?EIO=4&transport=polling` z glavo Origin |
| Avtentikacija operaterja | napačna skrivnost zavrnjena, pravilna sprejeta | verify skript |
| Omejitev povezav | 61. handshake z ene IP (Mac) dobi **403**, tudi s ponarejenima `X-Forwarded-For`/`X-Real-IP` | Node skript z Maca |
| Varnostne glave | prisotne, brez `X-Powered-By` | curl |
| Brez skrivnosti v logih | ni najdenih | pregled Railway logov |
| Baza ni javna | brez javnega TCP proxyja | Railway nastavitve |

## 5.4 Odpravljanje napak predogleda (24. 10. 2026) — zgodovinski zapis

1. **Predogled je bil zgrajen z URL-jem v1.** Vzrok: vrednost `NEXT_PUBLIC_API_URL` v Vercelu ob buildu. Popravljeno; produkcija 27. 10. kaže URL backend-v2 v bundleu.
2. **CORS 403 za izvor predogleda.** Popravek: v `FRONTEND_URL` dodan točen alias veje (brez wildcarda).
3. **PR #13:** vidno sporočilo o neuspešni povezavi; regresijski test za konfigurirane izvore; CI preverjanje, da se rezervni `localhost:3001` ne znajde v bundleu.

Zakaj CI tega ni ujel: CI gradi z lastnim `NEXT_PUBLIC_API_URL` in teče na `127.0.0.1`.

## 5.5 Lokalni bench zakasnitve in sočasnosti (26. 10. 2026) — kategorija B

Glej [poglavje 6](06-dokazi-hipotez.md#meritve-26-10-2026) in surove datoteke `rezultati/bench-2026-10-26-run{1,2,3}.json`. To so **lokalne loopback** meritve, ne produkcijske in ne CI.

## 5.6 Produkcijsko preverjanje v2 (27. 10. 2026) — kategorija C

- **backend-v2** deploy **`9cfd4f28`** (migracija `202610270001_operator_last_read` uporabljena).
- Socket E2E proti produkcijskemu backend-v2: **ALL_CHECKS_PASSED** — CORS za dovoljene izvore, zavrnitev tujega izvora, razvrščanje, prebrano stanje, prisotnost, pošiljanje offline, vrnitev obiskovalca, odgovor operaterja ([pregled-testov.md](gradivo/testing/pregled-testov.md)).
- Javni frontend (`https://live-chat.tacko.io`, `https://live-chat-support-demo.vercel.app`): HTTPS 200; v bundleu je URL backend-v2; prisotni so nizi UX PR #15 (`End chat`, `chat-token`/`localStorage`, obvestila o odhodu/vrnitvi). **Preverjeno** z neavtenticiranim `curl`/pregledom chunkov 27. 10. 2026 (brez izpisa skrivnosti).
- Ponovni javni CORS vzorec isti dan: Origin `https://live-chat.tacko.io` → 200; `https://evil.example` → 403; health `GET /` → 200 `{"status":"ok"}`.

**Omejitev:** produkcijski E2E ne meri zakasnitve v ms in ne zamenjuje lokalnega bencha (§5.5).
