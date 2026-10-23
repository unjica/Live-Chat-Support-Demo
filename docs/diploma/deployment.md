# Namestitev (priprava, brez objave)

Noben projekt Vercel/Railway ni bil ustvarjen ali objavljen. Ni bilo dostopa do produkcijskih podatkov. Spodaj so nastavitve za poznejše testno okolje; uspešna namestitev pri ponudnikih še ni dokazana.

## Lokalno

Iz korena izvedite `npm ci`, `npm run prisma:generate -w backend` in `docker compose -f compose.dev.yaml up -d postgres`. Kopirajte `backend/.env.example` v `backend/.env` in nastavite naključno skrivnost. Kopirajte `frontend/.env.example` v `frontend/.env.local`. Počakajte na zdrav PostgreSQL, nato izvedite `npm run db:migrate -w backend` in `npm run dev`. Frontend uporablja vrata 3000, backend 3001. Compose geslo je samo za lokalni razvoj na loopback naslovu.

## Vercel frontend

Root Directory nastavite na `frontend`, Framework Preset na Next.js in vključite **Include source files outside of the Root Directory in the Build Step**, da sta korenski workspace manifest in lockfile dostopna. `frontend/vercel.json` določa install `cd .. && npm ci --include=dev` in build `cd .. && npm run build -w frontend`. Izhodno mapo pustite na privzeti Next.js nastavitvi. Ne ustvarjajte ločenega frontend lockfila.

Pred buildom nastavite `NEXT_PUBLIC_API_URL` na točen HTTPS izvor testnega Nest strežnika. Vrednost se vgradi v javno kodo; sprememba zahteva nov build. `OPERATOR_SECRET` in `DATABASE_URL` ne sodita v frontend. Socket.IO strežnik potrebuje ločen dolgotrajni proces.

## Railway backend in PostgreSQL

Backend servis uporablja koren repozitorija in korenski `railway.json` (Railpack). Build je `npm ci --include=dev && npm run build -w backend`; `prebuild` samodejno generira Prisma Client. Prisma CLI je neposredna runtime odvisnost backend paketa, ker ga pre-deploy migracija potrebuje tudi po morebitnem odstranjevanju razvojnih odvisnosti iz slike. Razvojne odvisnosti so potrebne med buildom.

Konfigurirani **pre-deploy** ukaz `npm run db:migrate -w backend` izvede `prisma migrate deploy` pred zagonom. Ob neuspešni migraciji se objava ne nadaljuje. Start je `npm start -w backend` (`node dist/main.js` v backend workspace). HTTP healthcheck je `GET /`, ki pri vsakem klicu izvede `SELECT 1` in vrne `{"status":"ok"}` ali generični HTTP 503. Povezava z bazo se preveri tudi ob zagonu. Ena replika je obvezna za trenutno prisotnost in sobe v pomnilniku.

Strežniške spremenljivke (vse so prikazane v `backend/.env.example`):

- `DATABASE_URL`: zasebna povezava Railway Postgres v namenskem testnem okolju.
- `OPERATOR_SECRET`: naključna skrivnost z vsaj 32 znaki; nikoli javna spremenljivka.
- `FRONTEND_URL`: točen dovoljen izvor, npr. `https://vas-test.vercel.app`; več izvorov ločite z vejico. Nastavite tudi izvor predogleda, če ga uporabljate; ne uporabljajte wildcarda. Socket.IO CORS in preverjanje Origin uporabljata isti seznam. Odjemalci brez Origin potrebujejo enako avtentikacijo.
- `PORT`: dodeli Railway; lokalna privzeta vrednost je 3001.
- `HOST`: privzeto `0.0.0.0`, da je proces dosegljiv prek ponudnikovega omrežja.

Po poznejši objavi preverite TLS/WebSocket upgrade, healthcheck, napačen Origin, napačno skrivnost, dva ločena obiskovalca in reconnect. Migracije izvajajte nad namensko bazo; pred spremembo obstoječe baze zagotovite varnostno kopijo. Pred javnim zagonom razrešite omejitve v gap-analysis.md in preostale audit ugotovitve.

Nastavitve sledijo [Railway config reference](https://docs.railway.com/config-as-code/reference), [pre-deploy navodilom](https://docs.railway.com/deployments/pre-deploy-command) in [Vercel monorepo navodilom](https://vercel.com/docs/monorepos/monorepo-faq). Lokalno sta bila preverjena produkcijski build in start obeh procesov, ne oddaljena infrastruktura.

## Polni Docker sklad (P3)

Za frontend, backend in PostgreSQL uporabite korenski `.env.example` ter `docker compose up --build -d --wait`. Navodila, migracijska storitev, trajni volumen, TLS, varnostne kopije in posodobitve so opisani v [README](../../README.md#docker-quick-start). Primerjava gostovanja je v [hosting.md](../hosting.md). Vrata baze privzeto niso objavljena.
