# 3. Uporabniški in administratorski del

Uporabniški vmesnik je v angleščini. Opis velja za kodo na `main` (`1114039`).

## Vstopna stran `/`

`frontend/src/app/page.tsx` je predstavitvena stran s povezavama na vlogi obiskovalca (`/visitor`) in operaterja (`/admin`). `frontend/src/app/layout.tsx` doda globalni `SocketInitializer` in `ErrorToast`.

## Obiskovalec `/visitor`

- `frontend/src/app/visitor/page.tsx` ob prikazu pokliče `connectChat("visitor")` in ob odhodu `disconnectSocket()`. Stran prikaže vsebino demo podjetja in plavajoči `ChatWidget`.
- **Prijava brez računa:** odjemalec pošlje `user_join {role:"visitor", token?}`. Žeton je shranjen v `localStorage` (`chat-token`; migracija iz starega `sessionStorage`). Brez žetona strežnik ustvari nov pogovor in vrne nov žeton. Na neveljaven žeton strežnik odgovori s kodo `UNAUTHORIZED`; odjemalec takrat žeton zbriše in enkrat ustvari nov pogovor (`frontend/src/lib/socket.ts`, `join()`).
- **ChatWidget / ChatWindow** (`frontend/src/components/visitor/`): gumb odpre okno s pozdravom (`frontend/src/config/chat.ts`), zgodovino, indikatorjem tipkanja in vnosnim poljem (`components/shared/MessageInput.tsx`). Števec neprebranih je na gumbu.
- **Stanje povezave:** vnos je onemogočen, dokler `ready` ni `true`. Od PR #13 (24. 10. 2026) okno, ki se ne more povezati, prikaže status (npr. »Connection failed. Retrying…«), `ErrorToast` pa sporočilo »Cannot reach the chat server. Retrying…«.
- **Pošiljanje:** vsako sporočilo dobi `clientMessageId` (UUID). Če potrdila ni, besedilo ostane in ponovitev uporabi isti id. Strežnik vrne obstoječe sporočilo, zato dvojnik ne nastane.

## Operater `/admin`

- `frontend/src/app/admin/page.tsx`: obrazec **Operator login** s poljem `type="password"` (»Operator secret«). Ob oddaji se pokliče `connectChat("admin", secret)`, polje se izprazni, skrivnost pa ostane samo v pomnilniku modula (`credentials` v `socket.ts`), da deluje samodejna ponovna prijava. Ne shrani se v `localStorage` ali piškotke.
- Po uspešni prijavi: **stranska vrstica** s seznamom vseh pogovorov (tudi praznih), oznako online/offline (`visitors_online`) in neprebranimi sporočili; **glavni del** z izbranim pogovorom (`ChatHeader`, `MessageBubble`, `MessageInput`). Ob izbiri se zgodovina naloži z `select_conversation` (»Loading history…«). Na mobilnih napravah je stranska vrstica izvlečna.
- Napačna skrivnost: status »Could not join. Retry login or reconnect.« in toast z generičnim sporočilom, brez podrobnosti.

## Skupno

Stanje je v Zustand shrambi (`frontend/src/store/chatStore.ts`), brez trajne lokalne zgodovine. Sporočila se združijo po `id`, razvrstijo po `sequence` in prikažejo kot besedilo. Tipkanje se pošilja z `typing_start`/`typing_stop` (osvežitev največ vsakih 1,5 s, samodejni stop po 2 s nedejavnosti na odjemalcu in 5 s na strežniku). Na voljo je temni način (`DarkModeToggle`).

**Zaslonski posnetki niso zajeti** (glej `screenshots.md`). To je odprta naloga.


## Posodobitev 27. 10. 2026

- Admin: razvrščanje po zadnji aktivnosti, trajno prebrano ob odprtju (`operatorLastReadSequence`), obvestila o odhodu/vrnitvi, pošiljanje offline.
- Obiskovalec: žeton v `localStorage`, gumb **End chat**.
