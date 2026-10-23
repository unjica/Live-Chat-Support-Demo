# Testiranje in dejanski rezultati

Lokalno preverjanje 23. 10. 2026: Node 24.10.0, PostgreSQL 16 v ločenem vsebniku `postgres:16-alpine`, vrata 127.0.0.1:55432, namenska baza chat_test. Nobenega testnega rezultata ne simuliramo. Native initdb ni uspel zaradi omejitve deljenega pomnilnika; uporabljen je bil pravi PostgreSQL v Dockerju.

Ukazi iz korena:

```sh
npm ci --cache /Users/unjica/.cache/npm-diploma
npm run prisma:generate -w backend
DATABASE_URL=postgresql://chat:chat@127.0.0.1:55432/chat_test npm run db:migrate -w backend
npm run lint
npm run typecheck
npm run build
DATABASE_URL=postgresql://chat:chat@127.0.0.1:55432/chat_test npm test
```

- npm ci: uspeh; korenski workspace lockfile je vir resnice, zastarela ločena lockfila sta odstranjena.
- Prisma generate 6.19.3: uspeh; migracija 202610230001_init: uspešno uporabljena na prazni bazi.
- Lint: exit 0; frontend 0 napak in 3 opozorila (postcss anonimni export, obstoječa img v admin/Avatar), backend brez napak.
- Typecheck: oba projekta exit 0.
- Build: oba projekta exit 0. Next.js 15.5.28: Compiled successfully in 2.3s, Generating static pages (6/6); poti /, /_not-found, /admin, /visitor. Opozorili img in manjkajoči metadataBase ostajata; backend tsc uspe.
- Razvojni backend (ts-node): visitor user_join in send_message z zapisom v bazo uspešna; testni pogovor odstranjen.
- Jest: 1 suite passed; 8 tests passed, 8 total; 0 snapshots; zadnji polni izpis 1.548 s.

Testi preverjajo: Nest health/izmenjavo dogodkov (H2); sočasna obiska, operaterjeve odgovore in tipkanje (H1); napačne skrivnosti/žetone, tujo zgodovino, tuje pošiljanje/tipkanje, dodatna senderId polja in dvojno prijavo (H1); zaporedje, sočasne ponovitve istega clientMessageId, reconnect in zgodovino (H3); neveljavno/prazno/predolgo vsebino; zavrnjen Origin; dve povezavi istega obiska in hash žetona; zgodovino po popolnem zaprtju in ponovnem zagonu Nest ter nadaljnji odgovor operaterja (H3).

Suite ne uporablja mock baze ali gatewaya; uporabi resnični Nest HTTP/Socket.IO strežnik na naključnih vratih. Testi odstranijo samo svoje pogovore po ID. Brez DATABASE_URL test namenoma odpove z navodilom; nič se ne preskoči. Za ponovitev uporabite prazno namensko bazo in migracijo. Preizkušena je ena instanca, ne porazdeljeno okolje.

Poskus Playwright browser smoke ni stekel: Chromium je macOS sandbox zavrnil z `MachPortRendezvous ... Permission denied`. Zato brskalniški E2E, zaslonski posnetki in vizualna QA niso opravljeni. Frontend dev je v tem omejenem okolju opozarjal EMFILE pri watchers; produkcijski build je uspel. Za omejena okolja lahko lokalno uporabite WATCHPACK_POLLING=true. Načrt ročnih dokazov je v screenshots.md. Nobena objava na Vercel/Railway ni bila izvedena.

npm ci je po združljivih popravkih odvisnosti poročal 42 ranljivosti (3 moderate, 39 high, 0 critical). Preostale vključujejo razvojna orodja Jest/Prisma/Tailwind in PostCSS v Next; avtomatski predlogi zahtevajo tudi večje nadgradnje. To ni čist varnostni audit ali dovoljenje za produkcijo. Testi in build ne dokazujejo odsotnosti ranljivosti. V tej nalogi ni bilo prisilnih major nadgradenj ali oslabitve testov.
