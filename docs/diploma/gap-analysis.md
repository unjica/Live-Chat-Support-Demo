# Analiza vrzeli

Pregled izhodišča `9d5ab33` (23. 10. 2026): frontend Next.js 15.3.1 / React 19, TypeScript, Zustand in Tailwind; backend Express, brez NestJS in baze. Pregledani so bili vsi izvorni moduli, poti, nastavitve, skripte in obstoječa dokumentacija. Testov in CI ni bilo.

- H1: `io.emit('receive_message')` je pošiljal vse pogovore vsem odjemalcem. Filtriranje prikaza ni avtorizacija. `user_join` je zaupal odjemalčevemu id/role, zato je bilo mogoče ponarediti operaterja. Tipkanje je uporabljalo sobe, vendar brez zanesljive identitete.
- H2: Next.js in Socket.IO sta bila prisotna; NestJS in PostgreSQL iz dispozicije nista bila implementirana.
- H3: zgodovina je bila samo v sessionStorage/localStorage. Ponovna povezava ni ponovno avtorizirala obiska; ni bilo strežniškega vrstnega reda ali preprečevanja dvojnikov.
- `/admin` je bil javna stran s samodejno dodeljeno vlogo. Strežnik ni preverjal skrivnosti operaterja. REST je imel samo health endpoint; podatkovnih REST poti ni bilo.
- `next lint` ni ustrezal konfiguraciji Next 15; ni bilo backend lint/typecheck/build/test skript. README je navajal lokalno hrambo ter star Express zagon in navodila za objavo.

Izvedba zapira te vrzeli z Nest gatewayem, validiranimi DTO, preverjeno identiteto na vsakem dogodku, sobami, PostgreSQL, unikatnim ključem ponovitve, zaporedjem in obnovo zgodovine. README in navodila so usklajeni. Lokalna ponovitev ne uvaža stare zgodovine ali starega visitor-id.

Preostalo: skupna skrivnost operaterja, brez individualnih računov/MFA, brez izteka in preklica žetonov, brez omejitve števila povezav ali porazdeljenega rate limiting, brez paginacije/retencije, brez Redis adapterja. CORS/Origin ni nadomestilo za avtentikacijo. Žeton v sessionStorage je bearer poverilnica, dostopna skriptam istega izvora. HTTPS je obvezen zunaj lokalnega okolja. Zunanji avatarji lahko razkrijejo obisk tretji strani. Avtomatski testi pokrivajo strežnik; vizualno preverjanje in brskalniški E2E ostajata ločena naloga. Nobene produkcijske namestitve ali podatkov nismo spreminjali.
