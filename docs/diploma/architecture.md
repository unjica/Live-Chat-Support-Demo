# Arhitektura

```mermaid
flowchart LR
  V[Obiskovalec /visitor] -->|Socket.IO + žeton| G[NestJS ChatGateway]
  O[Operater /admin] -->|Socket.IO + skrivnost| G
  G --> S[ChatService]
  S --> P[PrismaService]
  P --> D[(PostgreSQL)]
  G -->|conv:id| V
  G -->|operators| O
```

Nest AppModule uvozi ConfigModule in registrira gateway ter storitvi. HTTP GET / vrne health procesa (ni preverjanje pripravljenosti baze na vsako zahtevo). Ob zagonu se Prisma poveže z bazo. Gateway izvaja validacijo in avtorizacijo za vsak dogodek. Napake vrnejo splošen error dogodek in negativni ack brez vsebine baze ali skrivnosti.

Obiskovalec je v eni sobi `conv:<conversationId>`, vsi preverjeni operaterji v `operators`. Operater izbira zgodovino in cilj odgovora; za prejem dogodkov ni treba vključiti vseh operaterjev v vsako sobo. Prisotnost velja za povezave trenutnega procesa. Potrebna je ena instanca; več instanc zahteva skupno prisotnost in Socket.IO adapter.
