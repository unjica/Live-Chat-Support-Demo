# Live Chat Support Demo

Diplomski prototip za »Razvoj spletne aplikacije za podporo uporabnikom v realnem času«: Next.js/React uporabniški vmesnik, NestJS + Socket.IO strežnik in PostgreSQL prek Prisma. Obiskovalci imajo ločene pogovore, operater dostopa s strežniško preverjeno skrivnostjo. Zgodovina je v podatkovni bazi; stara zgodovina iz brskalnika se ne uvaža.

## Lokalni zagon

Zahteve: Node.js 22+ in PostgreSQL (ali Docker Compose).

```sh
npm ci
npm run prisma:generate -w backend
docker compose up -d postgres
cp backend/.env.example backend/.env
# V backend/.env nastavite naključen OPERATOR_SECRET dolžine vsaj 32 znakov.
npm run db:migrate -w backend
npm run dev
```

Odprite `http://localhost:3000/visitor` in `http://localhost:3000/admin`. Operater vpiše skrivnost iz backend/.env. Za dva neodvisna obiskovalca uporabite ločena profila brskalnika; podvojen zavihek lahko podeduje sessionStorage. Skrivnosti nikoli ne vpisujte v `NEXT_PUBLIC_*`.

Frontend privzeto uporablja `http://localhost:3001`; po potrebi nastavite `NEXT_PUBLIC_API_URL` v frontend/.env.local. Backend uporablja `DATABASE_URL`, `OPERATOR_SECRET`, `PORT` in `FRONTEND_URL` (več dovoljenih izvorov ločite z vejico). Backend mora biti zagnan iz mape backend (workspace skripte to uredijo).

## Preverjanje

```sh
npm run lint
npm run typecheck
npm run build
# Uporabite namensko testno bazo, nikoli produkcijske.
DATABASE_URL=postgresql://chat:chat@localhost:5432/chat_test npm run db:migrate -w backend
DATABASE_URL=postgresql://chat:chat@localhost:5432/chat_test npm test
```

Testno bazo `chat_test` ustvarite posebej. Testi zaženejo pravi Nest HTTP/Socket.IO strežnik na naključnih vratih in odstranijo samo svoje pogovore. Ne uporabljajo ponarejene baze. `npm run build` izdela oba projekta; `npm start -w backend` zažene prevedeni backend.

## Struktura in omejitve

- `backend/src`: Nest modul, gateway, DTO, storitvi za pogovore in Prisma.
- `backend/prisma`: model in verzionirana migracija.
- `backend/test`: Jest integracijski testi s socket.io-client.
- `frontend/src`: App Router, Zustand, odjemalec Socket.IO, obiskovalec in operater.
- `docs/diploma`: analiza vrzeli, arhitektura, protokol, testi in navodila za namestitev.

To je prototip za en strežniški proces in skupni račun operaterja. Pred javno uporabo so potrebni dodatna zaščita pred zlorabami, upravljanje računov, življenjski cikel žetonov, paginacija, hramba/brisanje podatkov in preverjanje odvisnosti. Navodila za Vercel/Railway so v `docs/diploma/deployment.md`; v tej nalogi ni bilo nič objavljeno.

MIT. Avtorica: Sanja Malović.
