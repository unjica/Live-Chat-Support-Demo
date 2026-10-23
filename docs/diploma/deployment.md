# Namestitev (navodila, brez objave)

V tej nalogi ni bil ustvarjen ali objavljen noben projekt Vercel/Railway in ni bilo dostopa do produkcijskih podatkov. Koraki so predlog za testno okolje; nastavitve ponudnikov je treba ob izvedbi preveriti.

## Lokalno

Iz korena: npm ci, npm run prisma:generate -w backend, docker compose up -d postgres. Kopirajte backend/.env.example v backend/.env in nastavite naključno skrivnost. Počakajte na zdrav PostgreSQL, nato npm run db:migrate -w backend in npm run dev. Frontend teče na 3000, backend na 3001. Če Docker ni na voljo, uporabite svoj lokalni PostgreSQL in ustrezen DATABASE_URL. Compose geslo je samo za lokalni razvoj na loopback naslovu.

## Vercel frontend

Predviden projekt Next.js iz frontend, z dostopom do korenskega workspace lockfile. Namestitev v korenu: npm ci; build: npm run build -w frontend. Izhod Next.js upravlja ponudnik. Nastavite NEXT_PUBLIC_API_URL na HTTPS naslov testnega Nest strežnika pred buildom; to je javna nastavitev. OPERATOR_SECRET in DATABASE_URL ne sodita v frontend. Strežniškega Socket.IO procesa ne nameščajte kot Next serverless funkcije.

## Railway backend in PostgreSQL

Predviden ločen dolgoročno delujoč Node servis iz korena monorepa. Install: npm ci; build: npm run prisma:generate -w backend && npm run build -w backend; pred zagonom migracija npm run db:migrate -w backend; start: npm start -w backend. Nastavite DATABASE_URL iz zasebne povezave testnega Postgresa, OPERATOR_SECRET (naključno vsaj 32 znakov), FRONTEND_URL (točen HTTPS izvor frontenda; več izvorov z vejico) in ponudnikov PORT. Strežnik posluša na 0.0.0.0. Preverite podporo za WebSocket upgrade, TLS in zdravstveni HTTP GET /.

Uporabite eno repliko: prisotnost in Socket.IO sobe so v procesu. Baza je trajna, datoteke procesa niso vir zgodovine. Migracije izvajajte nad namenskim okoljem in pred spremembami baze zagotovite varnostno kopijo. Preverite, da napačen Origin in napačna skrivnost nista sprejeta. Izvedite scenarij z dvema ločenima obiskovalcema in reconnectom. Pred javnim zagonom razrešite omejitve iz gap-analysis.md in pregled odvisnosti. Ta dokument ne predstavlja opravljenega testa na Vercel/Railway.
