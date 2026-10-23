# Tehnologije

Frontend uporablja Next.js App Router, React 19, TypeScript, Zustand za pomnilniško stanje, Tailwind za slog in socket.io-client. NestJS 11 uporablja module, injiciranje odvisnosti, gateway in storitve. class-transformer/class-validator preverita DTO; @nestjs/config prebere okolje in ob zagonu zahteva bazo ter skrivnost dolžine najmanj 32 znakov. Prisma 6 ustvari tipiziran odjemalec za PostgreSQL. Jest/ts-jest poganja integracijske teste na pravem strežniku. Natančne razrešene različice so v korenskem package-lock.json; namestitev poteka v korenu z npm ci.

Nest uporablja Express kot HTTP adapter; poslovna logika ni več samostojni Express strežnik. Socket.IO omogoča samodejno ponovno povezavo in ack, ne zagotavlja sam po sebi trajne dostave. Zato sta zgodovina in ključ ponovitve v PostgreSQL.
