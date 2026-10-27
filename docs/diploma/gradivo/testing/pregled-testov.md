# Dokazi testiranja

Hipoteze **H1–H3** niso spremenjene. Podrobna razlaga: [06-dokazi-hipotez.md](../../06-dokazi-hipotez.md). Surovi rezultati: [../../rezultati/](../../rezultati/).

## 0. Ločitev kategorij

| Oznaka | Pomen | Ta dokument |
| --- | --- | --- |
| **A** | Avtomatizirani (Jest, Playwright, CI) | §1, [izvedba-lokalno.md](izvedba-lokalno.md) |
| **B** | Lokalni bench (loopback) | §3–§4; datoteke v `docs/diploma/rezultati/` |
| **C** | Produkcijsko preverjanje | §5 |


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
| **H2** — sklad Next/Nest/Socket.IO | build + Jest H2 + Playwright + gostovan backend-v2 + produkcijski FE v2 (27. 10.) | podprta |
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

## 5. Produkcijsko preverjanje 27. 10. 2026 (dejstvo) — ločeno od A/B

To **ni** avtomatizirani CI test in **ni** lokalni bench.

- **backend-v2** deploy **`9cfd4f28`** (migracija `202610270001_operator_last_read`).
- Socket E2E proti produkcijskemu backend-v2: **ALL_CHECKS_PASSED** — CORS (dovoljeni izvori OK, tuji izvor zavrnjen), razvrščanje, prebrano stanje, prisotnost, pošiljanje offline, vrnitev obiskovalca, odgovor operaterja.
- Javni frontend v2: `live-chat.tacko.io` in `live-chat-support-demo.vercel.app` v bundleu kažeta na backend-v2; UX PR #15 je v produkcijskem bundleu (preverjeno z javnim pregledom chunkov).
- Ta paket gradiva **ni** spreminjal produkcije; posnetki so iz **izoliranega** lokalnega okolja.

## 6. Omejitve testiranja (jasno označeno)

- Bench je na **loopbacku** — ne vključuje internetne zakasnitve, TLS ali izrisa brskalnika.
- 100 sočasnih obiskovalcev **ni** test do meje zmogljivosti.
- Gostovanih meritev zakasnitve (Railway↔Vercel) v tem paketu **ni**.
- Posnetki zaslona so iz lokalnega okolja z izmišljenimi podatki; niso produkcijski snemki.
- Playwright E2E zahteva ločeno migrirano bazo in lokalni `OPERATOR_SECRET` (nikoli produkcijski).
