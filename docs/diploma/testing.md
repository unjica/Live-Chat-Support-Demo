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

Za E2E mora biti frontend zgrajen z zgornjim naslovom (vrata 43101). Playwright zažene produkcijski backend na 43101 in frontend na 43100; oba procesa po izvedbi zapre. Obstoječih procesov na teh vratih ne uporabi. E2E uporablja ločena konteksta obiskovalca in operaterja ter pravo bazo. Testno skrivnost podajte samo prek okolja. V CI `.github/workflows/ci.yml` ponovi install, migracijo, lint, typecheck, build, Jest ter Playwright s PostgreSQL service containerjem in Node 22. Oddaljeni CI za P1 je uspešen; dokaz in ločitev od lokalnih omejitev sta spodaj.

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

E2E scenarija preverjata izmenjavo v obe smeri, vrstni red v obeh prikazih, fokus vnosa, prekinitev pravega Socket.IO transporta in samodejno obnovo brez reload ter obnovo po neveljavnem shranjenem žetonu. Lokalni zagon P1 je bil blokiran, vendar sta oba scenarija pozneje uspela v CI za isti commit (spodaj). Ni preskočenih testov ali zamenjave baze z mockom. Jest odstrani samo svoje pogovore po ID; E2E odstrani svoje pogovore po hashu testnega žetona.

## Odvisnosti

`npm audit fix` brez `--force` je združljivo nadgradil `brace-expansion` 1.1.11 → 1.1.21. Število ugotovitev se je zmanjšalo z 42 (3 moderate, 39 high) na **41 (3 moderate, 38 high, 0 critical)**. Preostale korenske težave so `braces` (Jest/Tailwind/Next lint), `deepmerge-ts` (Prisma CLI), vgrajeni PostCSS v Next in `postcss-selector-parser` (Tailwind). Audit predlaga tudi prehod na Tailwind 4, Prisma 7 in Next 16; ti major preskoki presegajo varno združljivo nadgradnjo te faze. To ni čist varnostni audit ali odobritev za produkcijo. Ni bilo stresnega testa, meritve zakasnitve ali objave.

## P2: preverjeni CI dokazi in lokalna ponovitev (23. 10. 2026)

Pregledani so bili dejanski dnevniki obeh uspešnih CI izvajanj za commit `5a603740038b3fa17ffd08dfd7a2ccf824ee9a1f` (P1), ne samo značka PR:

- https://github.com/unjica/Live-Chat-Support-Demo/actions/runs/39929299846 — 23. 10. 2026, `2026-10-23T09:07:07.4990817Z   2 passed (4.8s)`.
- https://github.com/unjica/Live-Chat-Support-Demo/actions/runs/39929300022 — 23. 10. 2026, `2026-10-23T09:11:10.1142015Z   2 passed (6.5s)`.

Natančni vrstici prvega dnevnika: `Running 2 tests using 1 worker` in `2 passed (4.8s)`. Playwright uporablja privzeti CI dot reporter (`··`), zato ni dveh poimenskih vrstic PASS; ne izmišljamo jih. Datoteka `e2e/chat.spec.ts` ima natanko dva nepreskočena testa: `H3: ordered two-way display and reconnect without page reload` in `expired visitor token recovers with a new conversation`. Oba sta uspela. Jest v obeh CI: `Tests:       10 passed, 10 total`, ena zbirka. Install, migracija, lint, typecheck in build so prav tako uspeli.

P2 lokalno uporablja Node 24.10.0, npm 11.12.1 in ločeno novo bazo `chat_test` v Docker vsebniku `diploma-p2-postgres`, PostgreSQL 16, 127.0.0.1:55432. Migracija `202610230001_init` je uspešno uporabljena. Lint, typecheck in oba builda uspejo; Jest: **15/15**, ena zbirka, nič snapshotov. Pet novih primerov preveri iztečen/neaktiven žeton, omejevanje prijav, generični HTTP 503 ob nedostopni bazi, dejanski časovni disconnect ob izteku in omejevanje dogodkov brez zapisov v bazo. Izvirnih deset testov ostaja. Lokalni Playwright P2: **0 passed, 2 failed pred koraki**, Chromium `MachPortRendezvous ... Permission denied (1100)`; oba strežnika se zaženeta. To je omejitev lokalnega sandboxa, ne preklic uspešnih CI rezultatov P1.

Spremembe P2 so namenoma necommitane za zunanji runner. Končni SHA in CI za P2 še ne obstajata; po objavi mora runner preveriti nova izvajanja, vključno z obema E2E. P1 CI ni dokaz za nove spremembe P2. Ni bilo produkcijskih podatkov, deploya, mergea ali izdaje. Trenutna varnostna analiza in štetje sta v [security-audit.md](security-audit.md); prejšnje štetje zgoraj je zgodovinsko.
