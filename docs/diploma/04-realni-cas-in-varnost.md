# 4. Komunikacija v realnem času in varnost

## Socket.IO dogodki (`backend/src/chat.gateway.ts`)

| Smer | Dogodek | Payload (DTO, `backend/src/dto.ts`) | Odgovor / učinek |
| --- | --- | --- | --- |
| O→S | `user_join` | `{role: "visitor"\|"admin", token?, secret?}` (≤256 znakov) | ack `{ok, identity, token?, history, conversations, online}`; obiskovalec vstopi v sobo `conv:<id>`, operater v `operators`. Vsem operaterjem se pošljeta `conversations` in `visitors_online`. |
| O→S | `select_conversation` | `{conversationId: UUID}` | ack `{ok, history}` (po `sequence`); strežnik posodobi `operatorLastReadSequence` in odda `conversation_read` operaterjem |
| O→S | `send_message` | `{conversationId, clientMessageId: UUID, content: 1–4000}` | shrani; če je novo, odda `receive_message` v `conv:<id>` in `operators`; ack `{ok, message}` |
| O→S | `typing_start` / `typing_stop` | `{conversationId}` | `user_typing` / `user_stopped_typing` drugim v isti sobi in operaterjem |
| S→O | `receive_message` | `{id, sequence, conversationId, senderId, content, timestamp}` | |
| S→O | `conversations`, `visitors_online` | seznam pogovorov / id-jev pogovorov s povezanim obiskovalcem | samo soba `operators` |
| S→O | `visitor_presence` | `{ conversationId, online }` | odhod/vrnitev obiskovalca |
| S→O | `conversation_read` | `{ conversationId, operatorLastReadSequence }` | po odprtju niti |
| S→O | `error` | generično besedilo | ob vsaki zavrnitvi (`SocketErrors`) |

Validacija: `class-validator` z `whitelist` in `forbidNonWhitelisted` (dodatna polja so zavrnjena). Velikost paketa je omejena na 16 KiB (`maxHttpBufferSize: 16384`). Prazno sporočilo je zavrnjeno.

## Sobe in izolacija

Identiteta je vezana na socket (`socket.data.user`) po uspešnem `user_join`. Vsak dogodek kliče `ChatService.authorize()`: obiskovalec sme dostopati samo do svojega `conversationId` z veljavnim in neizteklim žetonom ter aktivnim pogovorom. `senderId` vedno določi strežnik. Sporočilo gre izključno v `conv:<id>` in `operators`, zato drugi obiskovalci sporočila ne prejmejo.

## Ponovna povezava in zgodovina

Socket.IO odjemalec se samodejno ponovno poveže (`reconnection: true`). Ob vsakem `connect` odjemalec ponovno izvede `user_join` s shranjenim žetonom ali skrivnostjo in prejme celotno zgodovino iz PostgreSQL. Operaterju se ponovno naloži izbrani pogovor. Ker je zgodovina v bazi, preživi ponovni zagon procesa ali baze (preverjeno, poglavje 5). Če strežnik prekine povezavo (npr. ob izteku žetona), se odjemalec poveže znova in ponovno avtenticira.

```mermaid
sequenceDiagram
  autonumber
  participant V as Obiskovalec (Next.js)
  participant G as ChatGateway (NestJS)
  participant S as ChatService
  participant DB as PostgreSQL
  participant O as Operater (/admin)
  O->>G: user_join {role: admin, secret}
  G->>S: timingSafeEqual(sha256(secret), sha256(OPERATOR_SECRET))
  G-->>O: ack {identity, conversations, online}; join "operators"
  V->>G: WSS handshake (Origin v FRONTEND_URL, ≤60/min/IP)
  V->>G: user_join {role: visitor, token?}
  G->>S: najdi po sha256(token) ali ustvari pogovor
  S->>DB: INSERT/SELECT Conversation
  G-->>V: ack {identity, token, history}; join "conv:id"
  G-->>O: conversations, visitors_online
  V->>G: send_message {conversationId, clientMessageId, content}
  G->>S: authorize + save
  S->>DB: INSERT Message (unikatni ključ proti dvojnikom)
  G-->>V: receive_message + ack {ok, message}
  G-->>O: receive_message (soba operators)
  O->>G: send_message {conversationId, clientMessageId, content}
  G->>S: authorize (admin) + save
  S->>DB: INSERT Message
  G-->>V: receive_message (soba conv:id)
  G-->>O: receive_message + ack
```

Izvožena sekvenca (za Word): [gradivo/diagrams/03-sekvenca-sporocilo.svg](gradivo/diagrams/03-sekvenca-sporocilo.svg) · [PNG](gradivo/diagrams/03-sekvenca-sporocilo.png) · [Mermaid vir](gradivo/diagrams/03-sekvenca-sporocilo.mmd).

## Varnostni mehanizmi

| Mehanizem | Implementacija | Preverjanje |
| --- | --- | --- |
| Žetoni obiskovalcev | 32 naključnih bajtov (`randomBytes`), v bazi samo SHA-256; veljavnost 30 dni od nastanka; ob izteku strežnik prekine socket | Jest: »expired and inactive visitor credentials…«, »visitor expiry disconnects…« |
| Skrivnost operaterja | `OPERATOR_SECRET` ≥ 32 znakov (preverjeno ob zagonu); primerjava `timingSafeEqual` nad zgoščenimi vrednostmi; nikoli v frontendu | Jest H1 negativne poti; preverjeno na backend-v2 (napačna skrivnost zavrnjena) |
| CORS / Origin | `FRONTEND_URL` je seznam **točnih** izvorov (vsak mora biti čist `URL.origin`, sicer zagon pade); isti seznam za Socket.IO CORS in `allowRequest` | Jest »WebSocket handshake rejects disallowed browser origin«, »accepts every configured cross-origin…« (PR #13); curl na backend-v2 |
| Omejitve hitrosti | 60 handshakeov/IP/min (`main.ts`); 5 `user_join` in 120 drugih dogodkov na socket/min (`SocketRateLimit`); zavrnjeni dogodki se štejejo | Jest »join abuse…«, »event abuse…«, »…rejects the 61st connection« |
| IP odjemalca za proxy | `TRUST_PROXY_HOPS` (desno štetje X-Forwarded-For) ali `CLIENT_IP_HEADER` (npr. `x-real-ip`, ki ga Railway edge prepiše); privzeto se uporabi peer naslov (`security.ts`) | 8 enotskih testov `clientIp`; na Railwayu je 61. povezava z Maca dobila 403 tudi s ponarejenimi glavami |
| Varnostne glave | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, CSP `default-src 'none'; frame-ancestors 'none'`, `Referrer-Policy: no-referrer`, COOP, HSTS v produkciji; brez `X-Powered-By` | Jest »sends security headers…«; curl na backend-v2 |
| Brez skrivnosti v bundleu | CI po buildu z grep preveri, da `.next/static` ne vsebuje `OPERATOR_SECRET`, `DATABASE_URL` ali `postgres://`, da vsebuje pričakovani `NEXT_PUBLIC_API_URL` in ne vsebuje rezervnega `localhost:3001` (PR #9, #13) | vsak CI zagon |
| Napake brez podrobnosti | `SocketErrors` zapiše samo razred napake in sklad, brez payloadov; odjemalec dobi generičen odgovor in kodo `UNAUTHORIZED` | Jest; pregled logov backend-v2 (brez skrivnosti) |
| Baza ni javna | brez Railway TCP proxyja; dostop samo prek `*.railway.internal` | preverjeno 23. 10. 2026 |
