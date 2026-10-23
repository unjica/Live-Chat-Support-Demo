# Implementacija

Obiskovalec ob vstopu na /visitor pošlje vlogo visitor in morebitni žeton iz sessionStorage. Brez žetona strežnik ustvari pogovor; neveljaven žeton zavrne. Odgovor vsebuje strežniško identiteto, žeton in zgodovino. Operater na /admin vnese skrivnost, ki se hrani le v pomnilniku in se ponovno uporabi ob prekinitvi povezave. Ob osvežitvi se ponovno prijavi. Ob odhodu s strani se povezava zapre in pomnilniška zgodovina počisti.

Zustand nima več lokalne trajne zgodovine. Operater dobi seznam vseh pogovorov, tudi praznih in nepovezanih. Izbira pogovora zahteva zgodovino iz baze. Nov dogodek in zgodovina se združita po id; sequence določi prikaz. Vnos je med odklopom onemogočen. Status povezave in toast pojasnita napako. Ob neuspeli potrditvi besedilo ostane; ponovitev istega besedila uporabi isti clientMessageId. Uspešno potrjeno besedilo se počisti. Sprememba besedila pomeni nov poskus z novim id. To ni trajna offline čakalna vrsta.

Vsak reconnect ponovno izvede user_join in obnovi zgodovino; operaterju obnovi izbrani pogovor. Strežnik ignorira odjemalčevo identiteto pri pošiljanju in jo izpelje iz preverjene povezave. DTO zavrne dodatna polja, neveljavne UUID, prazno vsebino ter več kot 4000 znakov. Socket.IO omeji velikost paketa na 16 KiB. React izpiše vsebino kot besedilo. Pri napakah se ne vrnejo podrobnosti Prisma ali poverilnice.
