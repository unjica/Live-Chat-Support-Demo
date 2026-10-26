# 5. Rezultati testov

Legenda: **Preverjeno** pomeni, da je bil test dejansko izveden in je zapisan rezultat. Navedeni so datum, commit in način.

## 5.1 Lokalni ponovni zagon vseh testov (26. 10. 2026, commit `1114039`)

Okolje: Linux x64 (8 jeder, 15 GB RAM), Node v22.23.4, PostgreSQL 18.6 (lokalna začasna instanca, testna baza `chat_test`), Chromium iz Playwright 1.64.1.

| Korak | Ukaz | Rezultat |
| --- | --- | --- |
| Namestitev | `npm ci` | uspešno |
| Migracija | `npm run db:migrate -w backend` | »All migrations have been successfully applied.« |
| Lint + typecheck | `npm run lint && npm run typecheck` | izhod 0 |
| Build | `NEXT_PUBLIC_API_URL=http://127.0.0.1:43101 npm run build` | izhod 0 (Next.js 15.5.28) |
| Jest | `npm test` | **2/2 zbirki, 28/28 testov, 0 snapshotov, 6,0 s** ([izpis](rezultati/jest-2026-10-26.txt)) |
| Playwright | `npm run test:e2e` | **2/2** (`H3: ordered two-way display and reconnect without page reload` 2,4 s; `expired visitor token recovers with a new conversation` 0,3 s) |

Jest testi (`backend/test/chat.spec.ts`, 15 testov z resničnim Nest strežnikom, PostgreSQL in Socket.IO odjemalci):
H2 health in izmenjava; H1 sočasna obiskovalca, izolacija, ciljani odgovori in tipkanje; H1 zavrnjene nepooblaščene vloge, žetoni, zgodovina, tipkanje, pošiljanje in ponarejanje; H3 vrstni red, preprečevanje dvojnikov, reconnect z zgodovino; validacija; zavrnjen nedovoljen Origin; H1 več zavihkov; neuspešen join počisti identiteto; ločena koda avtentikacije in enkratno oddajanje ob sočasnih ponovitvah; iztečeni/neaktivni žetoni; zloraba prijav; generični DB health 503; iztek obiskovalca prekine socket; zloraba dogodkov; H3 zgodovina preživi celoten življenjski cikel Nest procesa.
`backend/test/security.spec.ts` (13 testov): 8 enotskih testov za IP odjemalca in HSTS; integracijski testi za omejitev 61. povezave (hops=1, `CLIENT_IP_HEADER`, hops=0), sprejem vseh konfiguriranih izvorov in zavrnitev nenavedenih (PR #13) ter varnostne glave.

Zadnji uspešni test v `testing.md` z dne 23. 10. je imel 15 Jest testov. Razlika do 28 izhaja iz PR #6, #7 (varnost, IP odjemalca) in #13 (izvori).

## 5.2 CI (GitHub Actions, `.github/workflows/ci.yml`)

Opravili `validate` (Node 22, PostgreSQL 16: lint, typecheck, build, pregled bundla, Jest, Playwright) in `compose-smoke` (celoten Docker sklad, HTTP, avtentikacija, dva izolirana obiskovalca, štiri sporočila).

| Datum | Commit | Run | Rezultat |
| --- | --- | --- | --- |
| 23. 10. 2026 | `2692815` | [39934401485](https://github.com/unjica/Live-Chat-Support-Demo/actions/runs/39934401485) | uspešno (15/15 Jest, 2/2 Playwright, compose-smoke) |
| 24. 10. 2026 | `a9c2eaf` (PR #11) | [40087963202](https://github.com/unjica/Live-Chat-Support-Demo/actions/runs/40087963202) | uspešno |
| 24. 10. 2026 | `fd4f93e` (PR #12) | [40088239449](https://github.com/unjica/Live-Chat-Support-Demo/actions/runs/40088239449) | uspešno |
| 24. 10. 2026 | `1114039` (PR #13, trenutni `main`) | [40091092474](https://github.com/unjica/Live-Chat-Support-Demo/actions/runs/40091092474) | uspešno |
| 24. 10. 2026 | `ce25e05` (`release/v2`) | [40091894041](https://github.com/unjica/Live-Chat-Support-Demo/actions/runs/40091894041) | uspešno |

## 5.3 Preverjanje gostovanega backend-v2 (Railway, 23.–24. 10. 2026)

Izvedeno z Node Socket.IO odjemalcem in `curl` proti `https://backend-v2-production-1ea6.up.railway.app` (commita `5a18402`/`9a1f67e`). Skrivnost je bila brana iz datoteke in ni bila izpisana. Večino preverjanj je avtomatiziral `scripts/verify-deployment.cjs`.

| Preverjanje | Rezultat | Način |
| --- | --- | --- |
| HTTPS / TLS, health `GET /` | 200 `{"status":"ok"}` | curl |
| WSS povezava | uspešna | socket.io-client, transport websocket |
| Celoten krog obiskovalec → operater → obiskovalec | uspešen | Node skript (zadnjič 24. 10. 2026 z Origin aliasa predogleda: join, pošiljanje, nov operater vidi pogovor na seznamu, prejem, odgovor, prejem odgovora) |
| Izolacija dveh obiskovalcev | brez uhajanja; tuje pošiljanje zavrnjeno | verify skript |
| Reconnect z zgodovino | zgodovina obnovljena | verify skript |
| Zgodovina po ponovni namestitvi in po ponovnem zagonu baze | ohranjena | ročni redeploy in restart, nato branje zgodovine |
| CORS, točno ujemanje | dovoljeni izvori 200; `https://evil.example`, `https://chat.tacko.io`, unikatni URL predogleda 403 | curl na `/socket.io/?EIO=4&transport=polling` z glavo Origin |
| Avtentikacija operaterja | napačna skrivnost zavrnjena, pravilna sprejeta | verify skript |
| Omejitev povezav | 61. handshake z ene IP (Mac) dobi **403**, tudi s ponarejenima `X-Forwarded-For`/`X-Real-IP` | Node skript z Maca. Iz testnega okolja z menjajočimi se izhodnimi IP meritev ni veljavna. |
| Varnostne glave | prisotne, brez `X-Powered-By` | curl |
| Brez skrivnosti v logih | ni najdenih | pregled Railway logov |
| Baza ni javna | brez javnega TCP proxyja | Railway nastavitve |

## 5.4 Odpravljanje napak predogleda (24. 10. 2026)

1. **Predogled je bil zgrajen z URL-jem v1.** Railway HTTP logi: med ročnim testom predogleda (13:15–13:34 CEST) je backend-v2 prejel samo `GET /`, stari v1 backend pa zahteve `/socket.io/`. Isti vzorec se je ponovil ob testu ob 14:00 (v1: okoli 60 zahtev `/socket.io/` med 13:51 in 14:02, backend-v2: 0). Lokalni `next build` z URL-jem v2 je pravilno vgradil URL v2. Vzrok je bila vrednost `NEXT_PUBLIC_API_URL` v Vercelu ob buildu, ne koda. Popravek vrednosti v Vercelu ureja lastnica projekta; uspešen test v brskalniku še ni potrjen.
2. **CORS 403 za izvor predogleda.** `curl` z `Origin: https://live-chat-support-demo-q1vpm8z8d-unjicas-projects.vercel.app` in z aliasom `…-git-release-v2-…` je vrnil `HTTP 403 {"code":4,"message":"Forbidden"}`. Popravek: v `FRONTEND_URL` je dodan točen alias veje (brez wildcarda). Po ponovni namestitvi alias vrne 200.
3. **PR #13** (`1114039`): vidno sporočilo o neuspešni povezavi namesto tihe napake, regresijski test za konfigurirane izvore in CI preverjanje, da se rezervni `localhost:3001` ne znajde v bundleu.

Zakaj CI tega ni ujel: CI gradi z lastnim `NEXT_PUBLIC_API_URL` in teče na `127.0.0.1`. Vrednost iz Vercela v CI ni vidna. Napačen, a veljaven URL v Vercelu CI ne more zaznati.

## 5.5 Meritve zakasnitve in sočasnosti (26. 10. 2026)

Glej [poglavje 6](06-dokazi-hipotez.md#meritve-26-10-2026) in surove datoteke `rezultati/bench-2026-10-26-run{1,2,3}.json`.
