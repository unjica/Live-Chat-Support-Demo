# 3. Uporabniški in administratorski del

Uporabniški vmesnik je v angleščini. Opis velja za kodo na `main` (po PR #15: `localStorage`, razvrščanje, prebrano stanje, prisotnost).

## Vstopna stran `/`

`frontend/src/app/page.tsx` je predstavitvena stran s povezavama na vlogi obiskovalca (`/visitor`) in operaterja (`/admin`). `frontend/src/app/layout.tsx` doda globalni `SocketInitializer` in `ErrorToast`.

Posnetek: [gradivo/screenshots/01-zacetna-stran.png](gradivo/screenshots/01-zacetna-stran.png).

## Obiskovalec `/visitor`

- `frontend/src/app/visitor/page.tsx` ob prikazu pokliče `connectChat("visitor")` in ob odhodu `disconnectSocket()`. Stran prikaže vsebino demo podjetja in plavajoči `ChatWidget`.
- **Prijava brez računa:** odjemalec pošlje `user_join {role:"visitor", token?}`. Žeton je shranjen v **`localStorage`** pod ključem `chat-token` (`frontend/src/lib/visitorStorage.ts`; enkratna migracija iz starega `sessionStorage`). Brez žetona strežnik ustvari nov pogovor in vrne nov žeton. Na neveljaven žeton strežnik odgovori s kodo `UNAUTHORIZED`; odjemalec takrat žeton zbriše in enkrat ustvari nov pogovor (`frontend/src/lib/socket.ts`, `join()`).
- **End chat:** gumb v `ChatWindow` zbriše žeton (`clearVisitorToken`) in začne novo sejo. Zaprtje zavihka **ne** zbriše žetona — ob vrnitvi se zgodovina obnovi iz baze.
- **ChatWidget / ChatWindow** (`frontend/src/components/visitor/`): gumb odpre okno s pozdravom (`frontend/src/config/chat.ts`), zgodovino, indikatorjem tipkanja in vnosnim poljem (`components/shared/MessageInput.tsx`). Števec neprebranih je na gumbu.
- **Stanje povezave:** vnos je onemogočen, dokler `ready` ni `true`. Od PR #13 okno, ki se ne more povezati, prikaže status (npr. »Connection failed. Retrying…«), `ErrorToast` pa sporočilo »Cannot reach the chat server. Retrying…«.
- **Pošiljanje:** vsako sporočilo dobi `clientMessageId` (UUID). Če potrdila ni, besedilo ostane in ponovitev uporabi isti id. Strežnik vrne obstoječe sporočilo, zato dvojnik ne nastane.

Posnetki: [02](gradivo/screenshots/02-obiskovalec-pred-pogovorom.png), [02b](gradivo/screenshots/02b-obiskovalec-prazno-okno.png), [03](gradivo/screenshots/03-obiskovalec-pogovor.png), [06b](gradivo/screenshots/06b-obiskovalec-prejet-odgovor.png), [10](gradivo/screenshots/10-obnovljena-zgodovina.png).

## Operater `/admin`

- `frontend/src/app/admin/page.tsx`: obrazec **Operator login** s poljem `type="password"` (»Operator secret«). Ob oddaji se pokliče `connectChat("admin", secret)`, polje se izprazni, skrivnost pa ostane samo v pomnilniku modula (`credentials` v `socket.ts`), da deluje samodejna ponovna prijava. Ne shrani se v `localStorage` ali piškotke.
- Po uspešni prijavi: **stranska vrstica** s seznamom vseh pogovorov (tudi praznih), oznako online/offline (`visitors_online`) in neprebranimi sporočili; **glavni del** z izbranim pogovorom (`ChatHeader`, `MessageBubble`, `MessageInput`). Ob izbiri se zgodovina naloži z `select_conversation` (»Loading history…«). Na mobilnih napravah je stranska vrstica izvlečna.
- **Razvrščanje:** pogovori so urejeni po zadnji aktivnosti (zadnji `timestamp` sporočila, sicer `lastActivityAt` / `createdAt`) — najnovejši zgoraj.
- **Prebrano stanje:** ob odprtju niti strežnik posodobi `operatorLastReadSequence` in odda `conversation_read`; značka neprebranega preživi osvežitev strani.
- **Prisotnost:** v niti se prikažejo obvestila »Visitor left the chat…« / »Visitor returned…« (`data-testid="presence-notice"`). Operater lahko piše tudi, ko je obiskovalec offline; sporočila vidi ob vrnitvi.
- Napačna skrivnost: status »Could not join. Retry login or reconnect.« in toast z generičnim sporočilom, brez podrobnosti.

Posnetki: [04](gradivo/screenshots/04-admin-prijava.png), [05](gradivo/screenshots/05-admin-seznam-pogovorov.png), [06](gradivo/screenshots/06-admin-odprt-pogovor-odgovor.png), [07a–c](gradivo/screenshots/07a-admin-seznam-dveh-pogovorov.png), [08](gradivo/screenshots/08-obvestilo-odhod.png), [09](gradivo/screenshots/09-obvestilo-vrnitev.png).

## Skupno

Stanje je v Zustand shrambi (`frontend/src/store/chatStore.ts`), brez trajne lokalne zgodovine sporočil. Sporočila se združijo po `id`, razvrstijo po `sequence` in prikažejo kot besedilo. Tipkanje se pošilja z `typing_start`/`typing_stop` (osvežitev največ vsakih 1,5 s, samodejni stop po 2 s nedejavnosti na odjemalcu in 5 s na strežniku). Na voljo je temni način (`DarkModeToggle`).

Celoten katalog posnetkov: [gradivo/README.md](gradivo/README.md). Posnetki so iz **izoliranega lokalnega** okolja (27. 10. 2026), z izmišljenimi slovenskimi imeni; niso produkcijski snemki.
