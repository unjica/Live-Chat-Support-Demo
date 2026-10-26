# Diplomsko gradivo — Live Chat Support v2.0

Naslov: **»Razvoj spletne aplikacije za podporo uporabnikom v realnem času«**. Potrjena dispozicija, hipoteze H1–H3 in obseg niso spremenjeni. Gradivo opisuje dejansko implementacijo na veji `main` (commit `1114039`, 24. 10. 2026). Vsaka trditev je označena kot **preverjeno** (z navedbo načina) ali **načrtovano**.

## Tehnično gradivo v2.0 (26. 10. 2026)

1. [Arhitektura in namestitev](01-arhitektura.md) — Next.js, NestJS, Socket.IO, PostgreSQL/Prisma, Vercel, Railway, Docker Compose; arhitekturni diagram.
2. [Podatkovni model](02-podatkovni-model.md) — tabele, polja, povezave, indeksi; ER-diagram.
3. [Uporabniški in administratorski del](03-uporabniski-in-administratorski-del.md) — zasloni in tokovi iz kode.
4. [Komunikacija v realnem času in varnost](04-realni-cas-in-varnost.md) — dogodki, sobe, reconnect, zgodovina, varnostni mehanizmi; diagram poteka sporočila.
5. [Rezultati testov](05-rezultati-testov.md) — lokalni zagon 26. 10. 2026, CI, preverjanja namestitve 23.–24. 10. 2026, odpravljanje napak predogleda.
6. [Dokazi za hipoteze H1–H3](06-dokazi-hipotez.md) — preslikava na merljive dokaze, meritve zakasnitve in sočasnosti.
7. [Tehnologije in različice](07-tehnologije-in-razlicice.md).
8. [Omejitve in nedokončane funkcionalnosti](08-omejitve.md) — preverjeno proti načrtovano.

Surovi rezultati: [rezultati/](rezultati/). Merilni skript: [`scripts/bench/latency-and-concurrency.cjs`](../../scripts/bench/latency-and-concurrency.cjs).

## Starejše delovne datoteke (P1–P4, 23. 10. 2026)

[architecture.md](architecture.md), [database.md](database.md), [deployment.md](deployment.md), [gap-analysis.md](gap-analysis.md), [hypotheses.md](hypotheses.md), [implementation.md](implementation.md), [screenshots.md](screenshots.md), [security-audit.md](security-audit.md), [socket-events.md](socket-events.md), [technologies.md](technologies.md), [testing.md](testing.md). Ostajajo nespremenjene kot zgodovinski zapis faz. Kjer se razlikujejo od novega gradiva (npr. `deployment.md` pravi, da namestitve še ni bilo), velja novejše gradivo 01–08.
