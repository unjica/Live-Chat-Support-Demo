-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "sequence" SERIAL NOT NULL,
    "conversationId" TEXT NOT NULL,
    "clientMessageId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_visitorId_key" ON "Conversation"("visitorId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_tokenHash_key" ON "Conversation"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Message_sequence_key" ON "Message"("sequence");

-- CreateIndex
CREATE INDEX "Message_conversationId_sequence_idx" ON "Message"("conversationId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "Message_conversationId_senderId_clientMessageId_key" ON "Message"("conversationId", "senderId", "clientMessageId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

