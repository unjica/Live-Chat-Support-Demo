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

Testi potrdijo več zaporednih sporočil, zaporedje, preprečevanje dvojnikov, reconnect s starim žetonom in nadaljnjo komunikacijo, obnovo zgodovine ter preživetje ponovnega zagona Nest. Frontend posluša dogodke, združuje sporočila in uporablja samodejno drsenje. Polna potrditev metodologije H3 zahteva še ročni/brskalniški dokaz samodejnega prikaza brez reload in vizualnega vrstnega reda. Dodan je ponovljiv Playwright scenarij za izmenjavo, vrstni red in reconnect ter CI konfiguracija. Oba brskalniška testa sta odpovedala pred prvim korakom, ker je lokalni zagon blokiral macOS sandbox (Chromium MachPortRendezvous Permission denied); ne navajamo uspešnega brskalniškega testa.

Natančni rezultati so v testing.md. Meritev zakasnitve, stresnega testa in produkcijskega preverjanja ni bilo.
