# Načrt zajemov zaslona

Zaslonski posnetki v tej izvedbi niso bili zajeti. Ne prikazujemo izmišljenih dokazov. Pred oddajo naloge v lokalnem/testnem okolju zajemite:

1. Obiskovalca A in B v ločenih profilih z različnima sporočiloma, poleg operaterja s seznamom obeh pogovorov.
2. Izbrani pogovor A z odgovorom operaterja; obiskovalec B tega odgovora ne vidi.
3. Tipkanje samo v ustreznem pogovoru.
4. Stanje prekinjene povezave in onemogočen vnos; po reconnectu obnovljeno zgodovino ter novo sporočilo brez reload.
5. Zavrnjeno prijavo operaterja brez razkritja skrivnosti.
6. Terminal z dejanskim izhodom Jest, lint, typecheck in build.

Ne zajemajte OPERATOR_SECRET, žetonov, .env ali osebnih podatkov. Posnetke označite z datumom, okoljem in koraki; to je načrt ročnega preverjanja, ne trditev o izvedenem brskalniškem E2E testu.

P1 vključuje `e2e/chat.spec.ts` in `playwright.config.ts` za avtomatsko preverjanje H3 ter obnovo po neveljavnem žetonu. Lokalni poskus je vrnil 2 napaki pri zagonu Chromium (`MachPortRendezvous Permission denied`), zato ni ustvaril dokazov prikaza ali posnetkov. Po uspešnem zagonu v neomejenem lokalnem/testnem okolju še vedno ročno zajemite zgornje primere; CI P1 za `5a60374` je pozneje potrdil 2/2 uspešna testa (oba dnevnika v testing.md); ročni vizualni dokazi še niso zajeti. CI za nove P2 spremembe še čaka runner.
