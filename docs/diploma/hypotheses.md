# Hipoteze in dokazi

Naslov ostaja »Razvoj spletne aplikacije za podporo uporabnikom v realnem času«. Obseg in hipoteze iz potrjene dispozicije niso spremenjeni.

## Hipoteza 1

Aplikacija omogoča sočasno komunikacijo več uporabnikov z operaterjem, pri čemer posamezni pogovori ostanejo med seboj ločeni.

Jest je preveril dva sočasna obiskovalca, ločeni sporočili, pravilno naslovljena odgovora operaterja obiskovalcema A in B, tipkanje brez dostave B, zavrnjene tuje zgodovine/pošiljanje/tipkanje ter ponarejanje identitete. Preverjena je tudi prisotnost istega obiska v dveh povezavah. V teh testnih scenarijih ni bilo mešanja pogovorov. To je pozitiven dokaz za H1 v lokalnem testnem okolju, ne dokaz za vse možne napade ali poljubno obremenitev.

## Hipoteza 2

Uporaba tehnologij Next.js, NestJS in Socket.IO omogoča razvoj spletne aplikacije za podporo uporabnikom v realnem času.

Pravi Nest strežnik se zažene, vrne HTTP health in izmenja Socket.IO sporočila s pravimi odjemalci; PostgreSQL shrani zgodovino. Next.js 15.5.28 izdela produkcijski build obeh vlog. Ključna tehnična integracija je potrjena; namestitev pri ponudnikih ni bila preizkušena.

## Hipoteza 3

Izdelana aplikacija omogoča uporabniku in operaterju uspešno komunikacijo v realnem času brez ponovnega nalaganja spletne strani.

Testi potrdijo več zaporednih sporočil, zaporedje, preprečevanje dvojnikov, reconnect s starim žetonom in nadaljnjo komunikacijo, obnovo zgodovine ter preživetje ponovnega zagona Nest. Frontend posluša dogodke, združuje sporočila in uporablja samodejno drsenje. Metodologijo samodejnega prikaza brez reload in vizualnega vrstnega reda preveri Playwright. Dodan je ponovljiv Playwright scenarij za izmenjavo, vrstni red in reconnect ter CI konfiguracija. Lokalni Chromium je bil blokiran pred koraki, vendar sta oba testa za P1 pozneje uspela v CI. Natančni dokazi so v testing.md.

Natančni rezultati so v testing.md. Meritev zakasnitve, stresnega testa in produkcijskega preverjanja ni bilo.

## Preslikava metodologije iz dispozicije v teste

- **H1 — več sočasnih obiskovalcev, pravilni pogovori in odgovori:** `backend/test/chat.spec.ts`, `H1: concurrent visitors isolated; operator replies and typing scoped` ustvari A/B, pošlje sporočila sočasno in preveri oba pravilno naslovljena odgovora. Primer `H1: unauthorized roles, tokens, history, typing, sends and spoofing rejected` preveri negativne poti, `H1: one disconnected tab does not mark another authorized tab offline` več zavihkov. Rezultat: vsi trije lokalno P2 in CI P1 uspešni, brez opaženega mešanja. S tem je H1 podprta v preizkušenih scenarijih, brez trditve o poljubni obremenitvi.
- **H2 — delujoč prototip z Next.js, NestJS, Socket.IO in obema vlogama:** `H2: Nest HTTP health and Socket.IO exchange`, produkcijski build obeh workspace in oba testa `e2e/chat.spec.ts`; prvi se prijavi kot obiskovalec in operater ter izmenja sporočila. Lokalno P2 uspešna integracija in build; CI P1 uspešna tudi oba E2E. H2 je podprta za ključne implementirane funkcionalnosti, brez dokaza gostovane namestitve.
- **H3 — zaporedna izmenjava, vrstni red, samodejni prikaz in reconnect brez reload:** Jest `H3: ordered messages, duplicate prevention, reconnect history and communication`, `authentication code is distinct from validation and concurrent first retries broadcast once` in `H3: history survives a full Nest process lifecycle and replies still work`; Playwright `H3: ordered two-way display and reconnect without page reload` preveri oba prikaza in števec dogodkov load = 0 ter prekine pravi transport. Drugi E2E preveri obnovo neveljavnega shranjenega žetona (ni časovni test poteka žetona). Novi P2 Jest primer preveri dejanski časovni potek in status. H3 je podprta z dejanskimi uspešnimi CI P1 brskalniškimi rezultati in lokalnimi integracijami; novi P2 browser rezultat še čaka zunanji CI.

CI P1 dne 23. 10. 2026 za `5a603740038b3fa17ffd08dfd7a2ccf824ee9a1f`: 10/10 Jest in 2/2 Playwright, oba izvajanja [39929299846](https://github.com/unjica/Live-Chat-Support-Demo/actions/runs/39929299846) in [39929300022](https://github.com/unjica/Live-Chat-Support-Demo/actions/runs/39929300022). Lokalno P2: 15/15 Jest, brskalnik blokiran pred koraki. P2 še nima commita/CI. Hipoteze, naslov in obseg dispozicije ostajajo nespremenjeni; meritve latence ali stresnega testa niso bile izvedene.
