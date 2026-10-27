# Dokazi testiranja

Hipoteze **H1–H3** niso spremenjene. Podrobna razlaga: [06-dokazi-hipotez.md](../../06-dokazi-hipotez.md). Surovi rezultati: [../../rezultati/](../../rezultati/).

## 1. Pregled funkcionalnih testov

| Sklop | Orodje | Lokacija | Zadnji preverjeni zagon |
| --- | --- | --- | --- |
| Enota / integracija (H1–H3, varnost) | Jest | `backend/test/` | glej spodaj (ta zagon) |
| Brskalnik (H3, žeton, admin UX) | Playwright | `e2e/chat.spec.ts` | glej spodaj |
| Compose dimni test | CI | `.github/workflows` | zgodovinski CI (glej 05) |
| Zakasnitev / sočasnost | `scripts/bench/latency-and-concurrency.cjs` | `docs/diploma/rezultati/bench-*.json` | 26. 10. 2026 |
| Produkcijski socket E2E | ročno / skripta | backend-v2 | **27. 10. 2026** (spodaj) |

Števila testov se zapišejo ob vsakem ponovnem zagonu v [izvedba-lokalno.md](izvedba-lokalno.md).

## 2. Dokazi H1 / H2 / H3 (brez sprememb hipotez)

| Hipoteza | Kratek dokaz | Status |
| --- | --- | --- |
| **H1** — sočasni ločeni pogovori | Jest izolacija; bench 100 obiskovalcev, 0 tujih sporočil (3 zagoni 26. 10.) | podprta |
| **H2** — sklad Next/Nest/Socket.IO | build + Jest H2 + Playwright + gostovan backend-v2 | podprta (FE produkcijski promote je korak upravljavca) |
| **H3** — realni čas brez reload | Playwright H3 (`load` = 0); Jest vrstni red / reconnect; loopback p50 ≈ 2 ms | podprta |

## 3. Preglednica obremenitvenih meritev (26. 10. 2026)

Vir: `docs/diploma/rezultati/bench-2026-10-26-run{1,2,3}.json`. Enota: ms. Okolje: lokalni loopback, produkcijski build backenda, ločena baza `chat_bench`.

| Zagon | obiskovalec→operater p50/p95/max | operater→obiskovalec p50/p95/max | 100 povezav+prijav (ms) | pošiljanja OK | tuji prejemi | vrstni red |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 2,16 / 3,80 / 35,53 | 2,13 / 3,63 / 6,74 | 192,9 | 500/500 | 0 | da |
| 2 | 2,02 / 2,90 / 4,35 | 1,92 / 2,90 / 3,52 | 181,6 | 500/500 | 0 | da |
| 3 | 2,08 / 2,95 / 4,76 | 1,99 / 2,96 / 3,68 | 206,5 | 500/500 | 0 | da |

## 4. Metodologija merjenja

Skript `scripts/bench/latency-and-concurrency.cjs` meri na istem gostitelju (`performance.now()`):

1. **Zakasnitev:** 100 zaporednih sporočil; čas do `receive_message` v obe smeri.
2. **Sočasnost:** 100 obiskovalcev × 5 sporočil + odgovori operaterja; preveri izolacijo in `sequence`.

Za bench se uporabi `CLIENT_IP_HEADER=x-real-ip` z različnimi IP, da rate limit 60 handshakeov/IP/min ne zavrne simulacije.

## 5. Produkcijsko preverjanje 27. 10. 2026 (dejstvo)

- **backend-v2** deploy **`9cfd4f28`** na commit `2559e9e` (vključno z migracijo `202610270001_operator_last_read`).
- Socket E2E proti produkcijskemu backend-v2: **ALL_CHECKS_PASSED** (CORS za dovoljene izvore OK; zavrnitev tujega izvora).
- Ta paket gradiva **ni** spreminjal produkcije; posnetki so iz **izoliranega** lokalnega okolja.

## 6. Omejitve testiranja (jasno označeno)

- Bench je na **loopbacku** — ne vključuje internetne zakasnitve, TLS ali izrisa brskalnika.
- 100 sočasnih obiskovalcev **ni** test do meje zmogljivosti.
- Gostovanih meritev zakasnitve (Railway↔Vercel) v tem paketu **ni**.
- Posnetki zaslona so iz lokalnega okolja z izmišljenimi podatki; niso produkcijski snemki.
- Playwright E2E zahteva ločeno migrirano bazo in lokalni `OPERATOR_SECRET` (nikoli produkcijski).
