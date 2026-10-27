# Načrt zajemov zaslona

Zaslonski posnetki v tej izvedbi niso bili zajeti. Ne prikazujemo izmišljenih dokazov. Pred oddajo naloge v lokalnem/testnem okolju zajemite:

1. Obiskovalca A in B v ločenih profilih z različnima sporočiloma, poleg operaterja s seznamom obeh pogovorov.
2. Izbrani pogovor A z odgovorom operaterja; obiskovalec B tega odgovora ne vidi.
3. Tipkanje samo v ustreznem pogovoru.
4. Stanje prekinjene povezave in onemogočen vnos; po reconnectu obnovljeno zgodovino ter novo sporočilo brez reload.
5. Zavrnjeno prijavo operaterja brez razkritja skrivnosti.
6. Terminal z dejanskim izhodom Jest, lint, typecheck in build.

Ne zajemajte OPERATOR_SECRET, žetonov, .env ali osebnih podatkov. Posnetke označite z datumom, okoljem in koraki; to je načrt ročnega preverjanja, ne trditev o izvedenem brskalniškem E2E testu.

`e2e/chat.spec.ts` in `playwright.config.ts` preverita H3 in obnovo neveljavnega žetona. Lokalni poskusi 23. 10. 2026 so bili blokirani pred koraki Chromium (`MachPortRendezvous Permission denied`); ročni vizualni dokazi še niso zajeti. Preverjeni CI dne 23. 10. 2026 za commit `2692815fe3fd1d229060474ebdb20252a581a112`: **15/15 Jest**, **2/2 Playwright** in uspešen **compose-smoke** (HTTP, avtentikacija, dva izolirana obiskovalca, štiri sporočila). [Dnevnik CI](https://github.com/unjica/Live-Chat-Support-Demo/actions/runs/39934401485). To potrjuje P2/P3; končni CI za pripravo izdaje P4 mora runner preveriti po objavi novega commita.

## Posnetki (27. 10. 2026)

Zaslonski posnetki so pripravljeni v izoliranem lokalnem okolju in shranjeni v [gradivo/screenshots/](gradivo/screenshots/). Avtomatizacija: `scripts/diploma-screenshots/capture.mjs` (Playwright, 1440×900, DSF 2). Produkcijskih podatkov in skrivnosti nismo zajeli.
