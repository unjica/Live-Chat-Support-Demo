# Testiranje in dejanski rezultati

Preverjanje P1, 23. 10. 2026: Node 24.10.0, npm 11.12.1, Prisma 6.19.3, Next.js 15.5.28. Uporabljena je bila nova namenska baza `chat_test` v Docker vsebniku `diploma-p1-postgres` (`postgres:16-alpine`, 127.0.0.1:55432). Produkcijski podatki niso bili uporabljeni.

## Lokalna ponovitev

```sh
npm ci
npm run prisma:generate -w backend
# Za namenski lokalni testni PostgreSQL (ne produkcijo):
docker run --name diploma-p1-postgres -e POSTGRES_USER=chat -e POSTGRES_PASSWORD=chat -e POSTGRES_DB=chat_test -p 127.0.0.1:55432:5432 -d postgres:16-alpine
export DATABASE_URL=postgresql://chat:chat@127.0.0.1:55432/chat_test
export OPERATOR_SECRET=local-test-only-secret-at-least-32-characters
npm run db:migrate -w backend
npm run lint
npm run typecheck
NEXT_PUBLIC_API_URL=http://127.0.0.1:43101 npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

Za E2E mora biti frontend zgrajen z zgornjim naslovom (vrata 43101). Playwright zažene produkcijski backend na 43101 in frontend na 43100; oba procesa po izvedbi zapre. Obstoječih procesov na teh vratih ne uporabi. E2E uporablja ločena konteksta obiskovalca in operaterja ter pravo bazo. Testno skrivnost podajte samo prek okolja. V CI `.github/workflows/ci.yml` ponovi install, migracijo, lint, typecheck, build, Jest ter Playwright s PostgreSQL service containerjem in Node 22. Oddaljeni CI v tej izvedbi še ni bil zagnan.

## Dejanski rezultati P1

- `npm ci --cache /Users/unjica/.cache/npm-diploma`: exit 0; 786 paketov dodanih, 789 pregledanih.
- `prisma generate`: uspeh; `prisma migrate deploy`: migracija `202610230001_init` uspešno uporabljena na prazni testni bazi.
- `npm run lint`: exit 0, oba workspace brez napak in brez opozoril. Tri opozorila P0 so odpravljena z imenovanim PostCSS izvozom in Next Image.
- `npm run typecheck`: exit 0, oba workspace; preverjen tudi `pretypecheck` Prisma hook.
- `npm run build`: exit 0, oba workspace; frontend je generiral 6/6 statičnih strani, backend tsc je uspel s `prebuild` generiranjem. Ostaja predhodno opozorilo `metadataBase` za družbene predoglede.
- `npm test`: 1 suite passed, **10/10 tests passed**, 0 snapshots.
- Dodatni strogi TypeScript pregled Playwright konfiguracije in E2E datoteke: exit 0.
- `npm run test:e2e`: **2 failed, 0 passed**, obe napaki pri zagonu Chromium pred prvim testnim korakom: `MachPortRendezvous ... Permission denied (1100)`. Aplikacijska strežnika sta se uspešno zagnala. Uspešnega E2E ali vizualnega rezultata ne trdimo.

Jest ohrani vseh 8 scenarijev P0: Nest HTTP/Socket.IO (H2); dva sočasna obiskovalca z obema pravilno naslovljenima odgovoroma in ločenim tipkanjem (H1); zavrnjene tuje zahteve in ponarejanje (H1); vrstni red, ponovitve in reconnect (H3); validacija; zavrnjen Origin; več zavihkov in hash žetona; ponovni zagon Nest z ohranjeno zgodovino. P1 doda preverjanje, da ponovitev ne povzroči novega broadcasta, ter dva scenarija: neuspešen join po avtentikaciji odstrani identiteto/sobe in omogoči ponovitev; koda UNAUTHORIZED je ločena od validacijskih napak, sočasni prvi poskusi pa ustvarijo eno vrstico in en broadcast.

E2E scenarija preverjata izmenjavo v obe smeri, vrstni red v obeh prikazih, fokus vnosa, prekinitev pravega Socket.IO transporta in samodejno obnovo brez reload ter obnovo po neveljavnem shranjenem žetonu. Zaradi omejitve zagona brskalnika ti koraki še nimajo dejanskega uspešnega rezultata. Ni preskočenih testov ali zamenjave baze z mockom. Jest odstrani samo svoje pogovore po ID; E2E odstrani svoje pogovore po hashu testnega žetona.

## Odvisnosti

`npm audit fix` brez `--force` je združljivo nadgradil `brace-expansion` 1.1.11 → 1.1.21. Število ugotovitev se je zmanjšalo z 42 (3 moderate, 39 high) na **41 (3 moderate, 38 high, 0 critical)**. Preostale korenske težave so `braces` (Jest/Tailwind/Next lint), `deepmerge-ts` (Prisma CLI), vgrajeni PostCSS v Next in `postcss-selector-parser` (Tailwind). Audit predlaga tudi prehod na Tailwind 4, Prisma 7 in Next 16; ti major preskoki presegajo varno združljivo nadgradnjo te faze. To ni čist varnostni audit ali odobritev za produkcijo. Ni bilo stresnega testa, meritve zakasnitve ali objave.
