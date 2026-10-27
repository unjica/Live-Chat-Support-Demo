# Diplomsko gradivo — Live Chat Support v2.0

Naslov: **»Razvoj spletne aplikacije za podporo uporabnikom v realnem času«**. Potrjena dispozicija, hipoteze H1–H3 in obseg niso spremenjeni. Gradivo opisuje dejansko implementacijo na veji `main` (po PR #14 dokumentacija + PR #15 UX: `localStorage`, `operatorLastReadSequence`, obvestila o prisotnosti; produkcijski backend-v2 deploy `9cfd4f28` in produkcijski frontend v2, 27. 10. 2026). Vsaka trditev je označena kot **preverjeno** (z navedbo načina) ali **načrtovano**.

## Sedem primarnih virov za bibliografijo

Teh sedem dokumentov je namenjenih citiranju v diplomi (arhitektura → model → UI → realni čas/varnost → testi → H1–H3 → kratka preverjena povzetek):

1. [Arhitektura in namestitev](01-arhitektura.md)
2. [Podatkovni model](02-podatkovni-model.md)
3. [Uporabniški in administratorski del](03-uporabniski-in-administratorski-del.md)
4. [Komunikacija v realnem času in varnost](04-realni-cas-in-varnost.md)
5. [Rezultati testov](05-rezultati-testov.md) — loči avtomatizirane teste, lokalni bench in produkcijsko preverjanje
6. [Dokazi za hipoteze H1–H3](06-dokazi-hipotez.md)
7. [Kratka tehnična dokumentacija](gradivo/tehnicna-dokumentacija.md) — preverjene točke z datotečnimi potmi

Dopolnilno (ne štejejo med zgornjih sedem, a so uporabna): [07-tehnologije-in-razlicice.md](07-tehnologije-in-razlicice.md), [08-omejitve.md](08-omejitve.md), [gradivo/testing/pregled-testov.md](gradivo/testing/pregled-testov.md), [gradivo/testing/izvedba-lokalno.md](gradivo/testing/izvedba-lokalno.md).

## Vizualno in tehnično gradivo za Word (27. 10. 2026)

Mapa **[gradivo/](gradivo/)** vsebuje posnetke zaslona, diagrame (Mermaid + SVG/PNG), kratko tehnično dokumentacijo in dokaze testiranja z zemljevidom v podpoglavja 4.x / 5.x / 6.x. Glej [gradivo/README.md](gradivo/README.md).

## Celoten seznam tehničnega gradiva v2.0

1. [Arhitektura in namestitev](01-arhitektura.md)
2. [Podatkovni model](02-podatkovni-model.md)
3. [Uporabniški in administratorski del](03-uporabniski-in-administratorski-del.md)
4. [Komunikacija v realnem času in varnost](04-realni-cas-in-varnost.md)
5. [Rezultati testov](05-rezultati-testov.md)
6. [Dokazi za hipoteze H1–H3](06-dokazi-hipotez.md)
7. [Tehnologije in različice](07-tehnologije-in-razlicice.md)
8. [Omejitve in nedokončane funkcionalnosti](08-omejitve.md)

Surovi rezultati: [rezultati/](rezultati/). Merilni skript: [`scripts/bench/latency-and-concurrency.cjs`](../../scripts/bench/latency-and-concurrency.cjs).

## Starejše delovne datoteke (P1–P4, 23. 10. 2026)

[architecture.md](architecture.md), [database.md](database.md), [deployment.md](deployment.md), [gap-analysis.md](gap-analysis.md), [hypotheses.md](hypotheses.md), [implementation.md](implementation.md), [screenshots.md](screenshots.md), [security-audit.md](security-audit.md), [socket-events.md](socket-events.md), [technologies.md](technologies.md), [testing.md](testing.md). Ostajajo nespremenjene kot zgodovinski zapis faz. Kjer se razlikujejo od novega gradiva (npr. `deployment.md` pravi, da namestitve še ni bilo), velja novejše gradivo 01–08 in `gradivo/`.
