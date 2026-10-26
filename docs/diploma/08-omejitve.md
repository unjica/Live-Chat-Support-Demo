# 8. Omejitve in nedokončane funkcionalnosti

## Preverjeno stanje (26. 10. 2026)

- v2.0 je na `main` (`1114039`). CI je uspešen, lokalno 28/28 Jest in 2/2 Playwright.
- backend-v2 teče na Railwayu. Preverjeni so bili HTTPS, WSS, izolacija, reconnect, CORS, avtentikacija, omejitve in glave (poglavje 5.3).
- Predogled `release/v2` je zgrajen (`ce25e05`).

## Načrtovano / še ni dokončano

| Postavka | Stanje |
| --- | --- |
| Preklop produkcije (`live-chat.tacko.io`, `live-chat-support-demo.vercel.app`) na v2 | **ni izveden**; čaka uspešen brskalniški test in potrditev |
| Vrednost `NEXT_PUBLIC_API_URL` v Vercelu za predogled | ob testu 24. 10. je bundle še klical v1; potreben je popravek v Vercelu in nov build brez predpomnilnika |
| GitHub release `v2.0.0` | **ni ustvarjen** |
| Upokojitev v1 backenda | po stabilnem obdobju v2 |
| Čiščenje testnih pogovorov v bazi v2 | po varnostni kopiji, samo zapisi z `verify-` ali zabeleženimi id-ji |
| Zaslonski posnetki za nalogo | niso zajeti (`screenshots.md`) |
| Meritve v gostovanem okolju (zakasnitev prek interneta, obremenitev) | niso izvedene |

## Omejitve zasnove

- **Ena replika:** prisotnost, sobe in števci omejitev so v pomnilniku. Ni Redis adapterja ali porazdeljenih omejitev.
- **Ena skupna skrivnost operaterja:** ni individualnih računov, vlog ali MFA. Ni revizijske sledi po operaterju (`senderId` = `operator`).
- **Žeton obiskovalca** je bearer poverilnica v `sessionStorage`, dostopna skriptam istega izvora. Velja 30 dni, ni ročnega preklica.
- **Brez paginacije in retencije:** seznam pogovorov in zgodovina se naložita v celoti.
- Omejitve na socket se z novo povezavo obidejo. Omejitev handshakeov velja na IP.
- **Brez trajne čakalne vrste brez povezave** (offline queue). Neposlano besedilo ostane samo v polju.
- **Odvisnosti:** audit 23. 10. 2026 je navedel 39 ugotovitev (37 high, 2 moderate), glej `security-audit.md`.
- **Zunanji avatarji** lahko tretji strani razkrijejo obisk.
- Vmesnik je samo v angleščini.
