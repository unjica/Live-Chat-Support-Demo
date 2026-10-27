# Kratka tehnična dokumentacija (preverjeno v kodi)

Namen: dopolnitev poglavij **4** in **5** diplome. Daljši opisi so v [01–08](../README.md); tu so le preverjene točke z datotečnimi potmi (stanje `main` po PR #15, vključno z `localStorage`, `operatorLastReadSequence`, obvestili o prisotnosti; produkcijski FE+BE v2, 27. 10. 2026).

**Legenda:** **preverjeno** = implementirano v kodi; **načrtovano** = ni v tej izdaji.

## 1. Arhitektura aplikacije — preverjeno

| Sloj | Tehnologija | Poti |
| --- | --- | --- |
| Frontend | Next.js 15 / React 19 | `frontend/` (`app/page.tsx`, `app/visitor/page.tsx`, `app/admin/page.tsx`) |
| Realni čas (odjemalec) | Socket.IO odjemalec | `frontend/src/lib/socket.ts` |
| Backend | NestJS 11 | `backend/src/main.ts`, `app.module.ts` |
| Realni čas (strežnik) | Socket.IO prek `ChatGateway` | `backend/src/chat.gateway.ts` |
| Poslovna logika / DB | `ChatService` + Prisma 6 | `backend/src/chat.service.ts`, `backend/prisma/schema.prisma` |
| Baza | PostgreSQL | migracije v `backend/prisma/migrations/` |
| Gostovanje | Vercel (FE), Railway backend-v2 (BE + PG) | glej [01-arhitektura.md](../01-arhitektura.md) |

Diagram: [diagrams/01-arhitektura.svg](diagrams/01-arhitektura.svg) · [PNG](diagrams/01-arhitektura.png) · [Mermaid](diagrams/01-arhitektura.mmd).

## 2. Podatkovni model — preverjeno

Shema: `backend/prisma/schema.prisma`.

| Tabela | Namen |
| --- | --- |
| `Conversation` | En pogovor na obiskovalca; `visitorId`, `tokenHash` (SHA-256 žetona), `status`, `createdAt`, **`operatorLastReadSequence`** (zadnja prebrana `Message.sequence` pri operaterju; `null` = še ni odprto). |
| `Message` | Sporočilo z globalnim `sequence` (autoincrement), `conversationId`, `clientMessageId` (idempotentnost), `senderId`, `content`, `createdAt`. Unikat `(conversationId, senderId, clientMessageId)`. |

ER: [diagrams/02-er-model.svg](diagrams/02-er-model.svg) · [PNG](diagrams/02-er-model.png) · [Mermaid](diagrams/02-er-model.mmd). Podrobnosti: [02-podatkovni-model.md](../02-podatkovni-model.md).

## 3. Vzpostavitev povezave Socket.IO — preverjeno

1. Odjemalec pokliče `connectChat(role, secret?)` (`frontend/src/lib/socket.ts`) → `io(NEXT_PUBLIC_API_URL)`.
2. Ob `connect` pošlje `user_join` z `role` (`visitor`|`admin`), morebitnim žetonom obiskovalca ali `secret` operaterja.
3. Strežnik (`ChatGateway.handleUserJoin`) preveri identiteto prek `ChatService`, pridruži sobi in vrne zgodovino / seznam.
4. Dogodki: `send_message`, `typing_start`/`typing_stop`, `select_conversation`, `visitor_presence`, `conversation_read`, `receive_message` (glej [04-realni-cas-in-varnost.md](../04-realni-cas-in-varnost.md)).

Sekvenca sporočila: [diagrams/03-sekvenca-sporocilo.svg](diagrams/03-sekvenca-sporocilo.svg) · [PNG](diagrams/03-sekvenca-sporocilo.png) · [Mermaid](diagrams/03-sekvenca-sporocilo.mmd).

## 4. Identifikacija obiskovalca in ohranjanje pogovora — preverjeno

- Žeton v **`localStorage`** pod ključem `chat-token` (`frontend/src/lib/visitorStorage.ts`; migracija iz `sessionStorage`).
- Strežnik shrani le `tokenHash` (`chat.service.ts`, `createHash("sha256")`).
- Ob neveljavnem žetonu: `UNAUTHORIZED` → odjemalec zbriše žeton in enkrat ustvari nov pogovor.
- **End chat** zbriše žeton (nova seja). Zaprtje zavihka **ne** zbriše žetona — ob vrnitvi se zgodovina obnovi iz baze.

## 5. Ločevanje pogovorov med obiskovalci — preverjeno

- Vsak obiskovalec ima svojo `Conversation` in Socket.IO sobo.
- Operater vidi vse; obiskovalec le svoj pogovor.
- Poskusi dostopa do tuje zgodovine / pošiljanja so zavrnjeni (Jest H1 v `backend/test/`).

## 6. Delovanje administracije — preverjeno

- `/admin`: obrazec **Operator login** (`type="password"`); `connectChat("admin", secret)` — skrivnost ostane v pomnilniku modula, ne v `localStorage` (`frontend/src/app/admin/page.tsx`).
- Seznam pogovorov: razvrščanje po zadnji aktivnosti, značka neprebranega iz `operatorLastReadSequence`, status online/offline.
- Ob odprtju niti: `select_conversation` → strežnik posodobi `operatorLastReadSequence` in odda `conversation_read`.
- Obvestila: »Visitor left…« / »Visitor returned…« (`data-testid="presence-notice"`).

## 7. Shranjevanje in prikaz zgodovine — preverjeno

- Vsako sporočilo se shrani v PostgreSQL pred razpošiljanjem (`ChatService`).
- Ob `user_join` / `select_conversation` strežnik vrne sporočila urejena po `sequence`.
- Po prekinitvi WebSocketa odjemalec ponovno pošlje `user_join` z istim žetonom; zgodovina se obnovi **brez** ponovnega nalaganja strani (Playwright H3).

## 8. Varnostni mehanizmi — preverjeno

| Mehanizem | Pot |
| --- | --- |
| `OPERATOR_SECRET` ≥ 32 znakov, brez privzetega `replace-` | `backend/src/app.module.ts`, `chat.service.ts` |
| CORS: točni izvori iz `FRONTEND_URL` (brez `*`) | `backend/src/main.ts` |
| Rate limiting handshake/dogodkov | `backend/src/main.ts`, `security.ts` |
| Žeton obiskovalca kot hash v DB | `chat.service.ts` |
| Geslo operaterja kot `type=password` | `frontend/src/app/admin/page.tsx` |

**Načrtovano / omejitve** (ne trdimo kot implementirano): individualni računi operaterjev, MFA, Redis adapter, paginacija/retencija — glej [08-omejitve.md](../08-omejitve.md).
