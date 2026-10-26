# 6. Dokazi za hipoteze H1–H3

Hipoteze so nespremenjene iz potrjene dispozicije (glej `hypotheses.md`).

## Meritve (26. 10. 2026)

**Metodologija.** Skript [`scripts/bench/latency-and-concurrency.cjs`](../../scripts/bench/latency-and-concurrency.cjs) zavrne vse razen lokalnega API-ja. Teče proti produkcijskemu buildu backenda (`node dist/main.js`, commit `1114039`, `NODE_ENV=production`) na `127.0.0.1:43201`. Baza je ločena lokalna `chat_bench` (PostgreSQL 18.6, nikoli v1 ali produkcija), odjemalec Node v22.23.4 na istem stroju (8 jeder). Zagnan je s `CLIENT_IP_HEADER=x-real-ip`, vsak simuliran odjemalec pa pošlje drugačen `X-Real-IP`, da omejitev 60 handshakeov/IP/min ne zavrne simuliranih obiskovalcev. Omejitev 120 dogodkov/socket/min je upoštevana z ločenima operaterskima povezavama.

1. **Zakasnitev:** 100 zaporednih sporočil obiskovalca. Merjeno: čas od `send_message` do prejema `receive_message` pri operaterju in od odgovora operaterja do prejema pri obiskovalcu (`performance.now()`, ms).
2. **Sočasnost in izolacija:** 100 obiskovalcev se hkrati poveže in prijavi. Vsak vzporedno pošlje 5 sporočil (500 skupaj), operater nato odgovori vsakemu. Preštejejo se potrdila, prejemi pri operaterju, sporočila tujih pogovorov pri vsakem obiskovalcu in vrstni red zgodovine po `sequence`.

**Rezultati treh zaporednih zagonov** (enota ms):

| Zagon | obiskovalec→operater p50 / p95 / max | operater→obiskovalec p50 / p95 / max | povezava+prijava 100 obiskovalcev | potrjenih pošiljanj | prejel operater (pričakovano 600) | obiskovalci s tujimi sporočili | obiskovalci z vsemi lastnimi (5+1) | vrstni red |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 2,16 / 3,80 / 35,53 | 2,13 / 3,63 / 6,74 | 192,9 | 500/500 | 600 | 0 | 100/100 | da |
| 2 | 2,02 / 2,90 / 4,35 | 1,92 / 2,90 / 3,52 | 181,6 | 500/500 | 600 | 0 | 100/100 | da |
| 3 | 2,08 / 2,95 / 4,76 | 1,99 / 2,96 / 3,68 | 206,5 | 500/500 | 600 | 0 | 100/100 | da |

Interpretacija in omejitve: zakasnitve so merjene na loopbacku in ne vključujejo internetne omrežne zakasnitve, TLS ali brskalniškega izrisa. So spodnja meja strežniške obdelave in shranjevanja v bazo. Najvišja vrednost 35,5 ms v 1. zagonu je enkraten izstop (verjetno ogrevanje). 100 sočasnih obiskovalcev ni obremenitveni test do meje zmogljivosti. Gostovanih meritev (Railway, Vercel) ni bilo.

## H1 — sočasna komunikacija več uporabnikov z ločenimi pogovori

| Dokaz | Vir | Status |
| --- | --- | --- |
| Dva sočasna obiskovalca, ciljani odgovori in tipkanje, brez mešanja | Jest `H1: concurrent visitors isolated…` | preverjeno lokalno 26. 10. in v CI |
| Zavrnjen dostop do tuje zgodovine, pošiljanje, tipkanje in ponarejanje | Jest `H1: unauthorized roles…` | preverjeno |
| Več zavihkov istega obiska | Jest `H1: one disconnected tab…` | preverjeno |
| **100 sočasnih obiskovalcev, 500 sporočil: 0 obiskovalcev s tujimi sporočili, 100/100 prejme vse svoje** | meritev 6, 3 zagoni | preverjeno lokalno |
| Izolacija na gostovanem backend-v2 | `verify-deployment.cjs` | preverjeno 23.–24. 10. |

**Ocena:** H1 je podprta s funkcionalnimi testi, merjeno do 100 sočasnih obiskovalcev. **Odprto:** večje obremenitve, več backend replik (niso podprte) in test z več resničnimi brskalniki.

## H2 — Next.js, NestJS in Socket.IO omogočajo razvoj aplikacije za podporo v realnem času

| Dokaz | Vir | Status |
| --- | --- | --- |
| Delujoča integracija Next.js 15.5.28, NestJS 11.2.7, Socket.IO 4.8.x, Prisma 6.19.3 in PostgreSQL | build, Jest `H2: Nest HTTP health and Socket.IO exchange`, Playwright | preverjeno lokalno 26. 10. in v CI |
| Obe vlogi v brskalniku (obiskovalec, operater) | Playwright `H3: ordered two-way display…` | preverjeno |
| Docker sklad deluje od začetka do konca | CI `compose-smoke` | preverjeno |
| Gostovan backend (HTTPS, WSS, PostgreSQL 18) | poglavje 5.3 | preverjeno |
| Gostovan frontend v2 v brskalniku na javni domeni | predogled zgrajen, ročni test v brskalniku še ni uspešen (poglavje 5.4) | **ni še potrjeno** |

**Ocena:** H2 je podprta na ravni implementacije in gostovanega backenda. Za popoln dokaz manjkata uspešen brskalniški test gostovanega frontenda v2 in preklop produkcije.

## H3 — komunikacija v realnem času brez ponovnega nalaganja strani

| Dokaz | Vir | Status |
| --- | --- | --- |
| Dvosmerni prikaz, vrstni red, reconnect brez reload (števec `load` = 0) | Playwright `H3: ordered two-way display…` | preverjeno lokalno 26. 10. in v CI |
| Vrstni red, idempotentnost, obnova zgodovine po reconnectu | Jest `H3: ordered messages…` | preverjeno |
| Zgodovina preživi ponovni zagon procesa | Jest `H3: history survives…`; gostovano po redeployu in restartu baze | preverjeno |
| **Zakasnitev dostave:** p50 ≈ 2 ms, p95 < 4 ms v obe smeri (loopback) | meritev 6 | preverjeno lokalno |

**Ocena:** H3 je podprta. **Odprto:** zakasnitev prek interneta (gostovano okolje) in zaslonski posnetki.
