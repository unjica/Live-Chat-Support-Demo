# 8. Omejitve in nedokončane funkcionalnosti

## Preverjeno stanje (27. 10. 2026)

- v2.0 je na `main` (vključno z UX PR #15: `localStorage` / `chat-token`, `operatorLastReadSequence`, obvestila o prisotnosti, **End chat**).
- Avtomatizirani testi: **30/30** Jest, **3/3** Playwright ([gradivo/testing/izvedba-lokalno.md](gradivo/testing/izvedba-lokalno.md)); CI ob združitvah zelen.
- **Produkcija:** frontend na `live-chat.tacko.io` in `live-chat-support-demo.vercel.app` kliče backend-v2; health in CORS (točni izvori) potrjeni; socket E2E 27. 10. uspešen (poglavje 5.6).
- Posnetki zaslona in diagrami: [gradivo/](gradivo/) (izolirano lokalno okolje).

## Načrtovano / še ni dokončano

| Postavka | Stanje |
| --- | --- |
| GitHub release `v2.0.0` | **ni ustvarjen** |
| Upokojitev v1 backenda | po stabilnem obdobju v2 |
| Odstranitev aliasa predogleda iz `FRONTEND_URL` (če še obstaja) | po potrditvi, ohraniti samo produkcijske točne izvore |
| Čiščenje testnih pogovorov v bazi v2 | po varnostni kopiji, samo zapisi z `verify-` ali zabeleženimi id-ji |
| Meritve v gostovanem okolju (zakasnitev prek interneta, obremenitev) | niso izvedene (lokalni bench 26. 10. je loopback) |

## Omejitve zasnove

- **Ena replika:** prisotnost, sobe in števci omejitev so v pomnilniku. Ni Redis adapterja ali porazdeljenih omejitev.
- **Ena skupna skrivnost operaterja:** ni individualnih računov, vlog ali MFA. Ni revizijske sledi po operaterju (`senderId` = `operator`).
- **Žeton obiskovalca** je bearer poverilnica v `localStorage` (prej `sessionStorage`), dostopna skriptam istega izvora. Velja 30 dni. Na deljenih računalnikih uporabi **End chat**. Operater lahko piše tudi offline; obiskovalec vidi sporočila ob vrnitvi.
- **Brez paginacije in retencije:** seznam pogovorov in zgodovina se naložita v celoti.
- Omejitve na socket se z novo povezavo obidejo. Omejitev handshakeov velja na IP.
- **Brez trajne čakalne vrste brez povezave** (offline queue). Neposlano besedilo ostane samo v polju.
- **Odvisnosti:** audit 23. 10. 2026 je navedel 39 ugotovitev (37 high, 2 moderate), glej `security-audit.md`.
- **Zunanji avatarji** lahko tretji strani razkrijejo obisk.
- Vmesnik je samo v angleščini.

## Spremembe UX (27. 10. 2026) — implementirano

- Seznam pogovorov: najnovejša aktivnost zgoraj (zadnja sporočila / `createdAt`).
- Ob odprtju pogovora se shrani `operatorLastReadSequence` v bazi; značka neprebranega preživi osvežitev.
- Obvestilo v niti ob odhodu/vrnitvi obiskovalca; namig pri tipkalniku, ko je offline.
- Žeton v `localStorage`; gumb End chat za novo sejo.
