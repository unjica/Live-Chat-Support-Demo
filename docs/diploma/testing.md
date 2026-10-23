# Testiranje — stanje pred izdajo 2.0.0

Preverjeni CI dne 23. 10. 2026 za commit `2692815fe3fd1d229060474ebdb20252a581a112`: **15/15 Jest**, **2/2 Playwright** in uspešen **compose-smoke** (HTTP, avtentikacija, dva izolirana obiskovalca, štiri sporočila). [Dnevnik CI](https://github.com/unjica/Live-Chat-Support-Demo/actions/runs/39934401485). To potrjuje P2/P3; končni CI za pripravo izdaje P4 mora runner preveriti po objavi novega commita.

## Ponovljivi ukazi

Uporabite Node 22+ in namensko PostgreSQL 16 bazo `chat_test`; nikoli produkcijskih podatkov. Iz korena:

```sh
npm ci
export DATABASE_URL=postgresql://chat:chat@127.0.0.1:5432/chat_test
export OPERATOR_SECRET=local-test-only-secret-at-least-32-characters
npm run db:migrate -w backend
npm run lint
npm run typecheck
NEXT_PUBLIC_API_URL=http://127.0.0.1:43101 npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

Jest uporablja pravi Nest, PostgreSQL in Socket.IO odjemalce: izolacija A/B, ciljani odgovori/tipkanje, negativna avtorizacija in ponarejanje, validacija, Origin, več zavihkov, hash žetona, zaporedje, idempotentnost in sočasne ponovitve, neuspešen join, reconnect in ponovni zagon procesa. Dodatni primeri preverijo iztečen/neaktiven žeton, dejanski časovni disconnect, omejitve prijav/dogodkov ter generični DB health 503. Ena zbirka, 15 testov, nič snapshotov; brez preskokov ali zamenjave baze z mockom.

Playwright zažene backend na 43101 in frontend na 43100 ter preveri `H3: ordered two-way display and reconnect without page reload` in `expired visitor token recovers with a new conversation`. Prvi preveri oba prikaza, fokus, vrstni red in števec load = 0; drugi neveljaven shranjeni žeton (časovni iztek preveri Jest). Testa odstranita lastne pogovore. CI uporablja Node 22, PostgreSQL 16 in Chromium.

Docker Compose je bil lokalno preverjen v P3 na Docker Desktop arm64: oba builda, tri zdrave storitve, migracija exit 0, ponoven zagon z obstoječim volumnom, aplikaciji UID 1000 in smoke s štirimi sporočili. CI isti smoke ponovi v ločenem opravilu.

## Zgodovinske lokalne omejitve

P1/P2/P3 dne 23. 10. 2026: lokalni Chromium je zavrnil zagon pred testnimi koraki (`MachPortRendezvous Permission denied (1100)`). To ni aplikacijski rezultat niti dokaz vizualnega pregleda; poznejši zgoraj navedeni CI P3 potrdi oba brskalniška testa. Ročni posnetki še niso zajeti. Stare meritve P1 (10 testov) so presežene z zgornjimi 15 testi.

Sveži audit P4 dne 23. 10. 2026: **39** paketnih ugotovitev (**37 high, 2 moderate, 0 critical/low**). Produkcijska namestitev: glej [security-audit.md](security-audit.md). Število vključuje podedovane pakete; ni število neodvisnih napadov. Stresni test, meritve latence, objava in produkcijski podatki niso bili del preverjanja.

## Lokalna ponovitev P4 — 23. 10. 2026

Namenska PostgreSQL 16 baza na 127.0.0.1:55432, brez produkcijskih podatkov. `npm ci`, Prisma generiranje/migracija, lint in typecheck obeh workspace uspejo; oba produkcijska builda uspešna (Next 6/6 strani). Jest **15/15**, ena zbirka, nič snapshotov, 3,407 s. Playwright **0 uspešnih / 2 blokirana pred koraki**, isti Chromium MachPortRendezvous permission denial; to ni nov uspešen lokalni E2E rezultat.

Sveže zgrajeni Compose: tri zdrave storitve, migracija exit 0, smoke uspešen (dva izolirana obiskovalca, štiri sporočila), obe aplikaciji UID 1000. `pg_dump -Fc` in `pg_restore` v ločeno prazno testno bazo uspeta. Privzeti native Compose zagon na 5432 je blokiran zaradi že zasedenih vrat; obstoječe storitve ne spreminjamo, testi uporabijo namensko bazo na 55432. README opozori na zahtevana prosta vrata.

Native `npm run dev` po okoljski napaki Watchpack EMFILE uspe z `WATCHPACK_POLLING=true`: backend health ter /visitor in /admin vrnejo HTTP 200. Po ponovnem buildu tudi `npm start -w backend` in `npm start -w frontend` vrneta HTTP 200. Začasne env datoteke in vse testne vsebnike smo odstranili; Compose volumni so ohranjeni.
