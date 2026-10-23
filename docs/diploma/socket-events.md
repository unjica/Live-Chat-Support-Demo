# Socket.IO protokol

Pot je /socket.io/, namespace /. Odjemalec čaka ack do 10 sekund. Uspeh vsebuje `ok: true`, napaka `ok: false, error` (pri avtentikacijskih napakah še `code: "UNAUTHORIZED"`); poleg tega se pošlje splošen `error`. Nepreverjena povezava ne sme dostopati do podatkov.

- `user_join`: `{role:'visitor', token?}` ali `{role:'admin', secret}`. Vrne identity, za obiskovalca token/history, za operaterja conversations/online. Dvojna prijava iste povezave je zavrnjena.
- `select_conversation`: `{conversationId}`. Vrne history; obiskovalec lahko bere samo svoj pogovor.
- `send_message`: `{conversationId, clientMessageId, content}`. Pošiljatelj in čas sta strežniška. Vrne message in samo ob novem zapisu odda `receive_message` sobi pogovora in operaterjem. Ponovitev vrne isto sporočilo v ack brez novega broadcasta; odjemalec združuje po id.
- `typing_start`, `typing_stop`: `{conversationId}`; oddajata `user_typing`/`user_stopped_typing` z id in conversationId samo ustreznemu pogovoru in operaterjem, razen pošiljatelju. Strežniška časovna omejitev po 5 sekundah brez obnove počisti tipkanje, tudi če odjemalec ne pošlje stop.
- `conversations`: seznam `{id,visitorId,status,createdAt}` samo operaterjem. Brez tokenHash.
- `visitors_online`: seznam id pogovorov s trenutno povezanim obiskovalcem, samo operaterjem.

Message je `{id,sequence,conversationId,senderId,content,timestamp}`. timestamp je milisekundni čas. Stari dogodki za join/send/typing ohranijo imena, payload pa je namerno strožji; starim odjemalcem se ne zaupa.

```mermaid
sequenceDiagram
  participant V as Obiskovalec
  participant G as Gateway
  participant DB as PostgreSQL
  participant O as Operater
  V->>G: user_join (žeton ali nov obisk)
  G->>DB: preveri / ustvari pogovor
  G-->>V: ack + identiteta + zgodovina
  V->>G: send_message + clientMessageId
  G->>DB: create; ob unikatnem konfliktu preberi obstoječe
  G-->>V: receive_message + ack
  G-->>O: receive_message
  V->>G: reconnect + user_join(žeton)
  G->>DB: history order by sequence
  G-->>V: ack + history
```

P2: obiskovalčev žeton velja 30 dni od nastanka pogovora; `identity.expiresAt` je čas izteka v milisekundah. Ob izteku strežnik zapre socket, klient se ponovno poveže in po UNAUTHORIZED začne nov pogovor brez stare lokalne zgodovine. Omejitve: 60 handshakeov/peer IP/min, 5 prijav/socket/min, 120 drugih dogodkov/socket/min; napačni payloadi se štejejo. Omejitev zavrne zahtevo s splošnim ok:false brez dostopa do baze. Podrobnosti in omejitve proxyja: security-audit.md.
