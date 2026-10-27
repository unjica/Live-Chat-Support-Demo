# Gradivo za diplomsko nalogo ERUDIO

**Naslov:** Razvoj spletne aplikacije za podporo uporabnikom v realnem času  
**Repozitorij:** [unjica/Live-Chat-Support-Demo](https://github.com/unjica/Live-Chat-Support-Demo)  
**Namen:** dokončanje poglavij **4** (Načrtovanje sistema) in **5** (Implementacija aplikacije) ter dopolnitev **6** (Namestitev in testiranje).

Daljša tehnična poglavja (ne podvajamo): [../01-arhitektura.md](../01-arhitektura.md) … [../08-omejitve.md](../08-omejitve.md).  
Kratka preverjena povzetka: [tehnicna-dokumentacija.md](tehnicna-dokumentacija.md).

Posnetki so iz **izoliranega lokalnega** okolja (27. 10. 2026), z izmišljenimi slovenskimi imeni. Skrivnosti niso vidne (polje gesla prikazuje pike). Skript: [`scripts/diploma-screenshots/capture.mjs`](../../../scripts/diploma-screenshots/capture.mjs).

---

## Posnetki zaslona (`screenshots/`)

| Datoteka | Opis | Predlagano podpoglavje |
| --- | --- | --- |
| `01-zacetna-stran.png` | Začetna stran z izbiro vloge | 5.x UI / 4.x zaslon |
| `02-obiskovalec-pred-pogovorom.png` | Obiskovalec pred odprtjem klepeta | 5.x obiskovalec |
| `02b-obiskovalec-prazno-okno.png` | Odprt prazen klepet | 5.x obiskovalec |
| `03-obiskovalec-pogovor.png` | Pogovor z več sporočili (Ana Novak) | 5.x obiskovalec |
| `04-admin-prijava.png` | Prijava operaterja (skrivnost zakrita) | 5.x administracija / 4.x varnost |
| `05-admin-seznam-pogovorov.png` | Nadzorna plošča s seznamom | 5.x administracija |
| `06-admin-odprt-pogovor-odgovor.png` | Odprt pogovor + odgovor operaterja | 5.x / 6.x H3 |
| `06b-obiskovalec-prejet-odgovor.png` | Obiskovalec prejme odgovor v živo | 5.x / 6.x H3 |
| `07a-admin-seznam-dveh-pogovorov.png` | Dva ločena pogovora na seznamu | 5.x / 6.x H1 |
| `07b-admin-drugi-pogovor.png` | Drugi pogovor (Marko Horvat) v admin | 5.x / 6.x H1 |
| `07c-obiskovalec-b-pogovor.png` | Obiskovalec B (izolacija) | 5.x / 6.x H1 |
| `08-obvestilo-odhod.png` | Obvestilo o odhodu obiskovalca | 5.x prisotnost |
| `09-obvestilo-vrnitev.png` | Obvestilo o vrnitvi | 5.x prisotnost |
| `10-obnovljena-zgodovina.png` | Obnovljena zgodovina po novem zavihku (`localStorage`) | 5.x / 6.x H3 |

## Diagrami (`diagrams/`)

| Datoteka | Opis | Predlagano podpoglavje |
| --- | --- | --- |
| `01-arhitektura.mmd`, `01-arhitektura.svg`, `01-arhitektura.png` | Arhitektura Next.js–NestJS–Socket.IO–PostgreSQL–Vercel/Railway | 4.x arhitektura |
| `02-er-model.mmd`, `02-er-model.svg`, `02-er-model.png` | ER iz `schema.prisma` (vključno z `operatorLastReadSequence`) | 4.x podatkovni model |
| `03-sekvenca-sporocilo.mmd`, `03-sekvenca-sporocilo.svg`, `03-sekvenca-sporocilo.png` | Sekvenca: obiskovalec → backend → DB → operater → odgovor | 4.x / 5.x potek |

PNG izvoz: mermaid-cli, belo ozadje, `scale ≥ 3`.

## Testiranje (`testing/`)

| Datoteka | Opis | Predlagano podpoglavje |
| --- | --- | --- |
| `pregled-testov.md` | Funkcionalni testi, H1–H3, bench, metodologija, omejitve, produkcijski E2E 27. 10. | 6.x |
| `izvedba-lokalno.md` | Dejanski lokalni zagon 27. 10. (števila testov) | 6.x |
| `jest-2026-10-27.txt` | Surovi izhod Jest | 6.x priloga |
| `playwright-2026-10-27.txt` | Surovi izhod Playwright | 6.x priloga |

Bench surovine ostanejo v [../rezultati/](../rezultati/).

## Tehnična dokumentacija

| Datoteka | Opis | Predlagano podpoglavje |
| --- | --- | --- |
| `tehnicna-dokumentacija.md` | Kratko preverjeno: arhitektura, model, Socket.IO, žeton, izolacija, admin, zgodovina, varnost | 4.x / 5.x |

## ZIP

Celoten paket (brez GitHub Release): lokalno `/workspace/diploma-gradivo.zip` (ustvari se ob pripravi; ni nujno v gitu). Mapo `docs/diploma/gradivo/` lahko preneseš neposredno z GitHuba.
