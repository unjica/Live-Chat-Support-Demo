import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { Message, Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";
import { JoinDto, MessageDto } from "./dto";
export type Identity = {
  role: "visitor" | "admin";
  id: string;
  conversationId?: string;
  expiresAt?: number;
};
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
@Injectable()
export class ChatService {
  constructor(
    private db: PrismaService,
    private config: ConfigService,
  ) {}
  async join(dto: JoinDto) {
    if (dto.role === "admin") {
      const expected = this.config.getOrThrow<string>("OPERATOR_SECRET");
      if (
        !dto.secret ||
        !timingSafeEqual(
          Buffer.from(hash(dto.secret)),
          Buffer.from(hash(expected)),
        )
      )
        throw new UnauthorizedException();
      return { identity: { role: "admin", id: "operator" } as Identity };
    }
    const token = dto.token || randomBytes(32).toString("hex");
    const conversation = dto.token
      ? await this.db.conversation.findUnique({
          where: { tokenHash: hash(token) },
        })
      : await this.db.conversation.create({ data: { tokenHash: hash(token) } });
    if (!conversation || conversation.status !== "active" ||
      conversation.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000 <= Date.now())
      throw new UnauthorizedException();
    return {
      identity: {
        role: "visitor",
        id: conversation.visitorId,
        conversationId: conversation.id,
        expiresAt: conversation.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000,
      } as Identity,
      token,
    };
  }
  async authorize(user: Identity | undefined, id: string) {
    if (!user || (user.role === "visitor" && (user.conversationId !== id ||
      !user.expiresAt || user.expiresAt <= Date.now())))
      throw new UnauthorizedException();
    const conversation = await this.db.conversation.findUnique({ where: { id } });
    if (user.role === "visitor" && conversation?.status !== "active")
      throw new UnauthorizedException();
    if (!conversation)
      throw new Error("Unknown conversation");
  }
  history(id: string) {
    return this.db.message.findMany({
      where: { conversationId: id },
      orderBy: { sequence: "asc" },
    });
  }
  async list() {
    const rows = await this.db.conversation.findMany({
      select: {
        id: true,
        visitorId: true,
        status: true,
        createdAt: true,
        operatorLastReadSequence: true,
        messages: {
          orderBy: { sequence: "desc" },
          take: 1,
          select: { sequence: true, createdAt: true, content: true, senderId: true },
        },
      },
    });
    return rows
      .map((c) => {
        const last = c.messages[0];
        return {
          id: c.id,
          visitorId: c.visitorId,
          status: c.status,
          createdAt: c.createdAt,
          operatorLastReadSequence: c.operatorLastReadSequence,
          lastActivityAt: last?.createdAt ?? c.createdAt,
          lastMessage: last
            ? {
                sequence: last.sequence,
                content: last.content,
                senderId: last.senderId,
                createdAt: last.createdAt,
              }
            : null,
        };
      })
      .sort(
        (a, b) =>
          b.lastActivityAt.getTime() - a.lastActivityAt.getTime() ||
          b.createdAt.getTime() - a.createdAt.getTime(),
      );
  }
  async markRead(user: Identity | undefined, conversationId: string) {
    if (!user || user.role !== "admin") throw new UnauthorizedException();
    await this.authorize(user, conversationId);
    const latest = await this.db.message.findFirst({
      where: { conversationId },
      orderBy: { sequence: "desc" },
      select: { sequence: true },
    });
    const sequence = latest?.sequence ?? 0;
    await this.db.conversation.update({
      where: { id: conversationId },
      data: { operatorLastReadSequence: sequence },
    });
    return { conversationId, operatorLastReadSequence: sequence };
  }
  async save(user: Identity, dto: MessageDto) {
    await this.authorize(user, dto.conversationId);
    const key = {
      conversationId: dto.conversationId,
      senderId: user.id,
      clientMessageId: dto.clientMessageId,
    };
    try {
      const message = await this.db.message.create({
        data: { ...dto, senderId: user.id },
      });
      return { message, created: true };
    } catch (error: unknown) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2002"
      )
        throw error;
      // The unique key arbitrates concurrent retries. Only the creator broadcasts.
      const message = await this.db.message.findUniqueOrThrow({
        where: { conversationId_senderId_clientMessageId: key },
      });
      return { message, created: false };
    }
  }
  format(m: Message) {
    return {
      id: m.id,
      sequence: m.sequence,
      conversationId: m.conversationId,
      senderId: m.senderId,
      content: m.content,
      timestamp: m.createdAt.getTime(),
    };
  }
}
