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
    if (!conversation) throw new UnauthorizedException();
    return {
      identity: {
        role: "visitor",
        id: conversation.visitorId,
        conversationId: conversation.id,
      } as Identity,
      token,
    };
  }
  async authorize(user: Identity | undefined, id: string) {
    if (!user || (user.role === "visitor" && user.conversationId !== id))
      throw new UnauthorizedException();
    if (!(await this.db.conversation.findUnique({ where: { id } })))
      throw new Error("Unknown conversation");
  }
  history(id: string) {
    return this.db.message.findMany({
      where: { conversationId: id },
      orderBy: { sequence: "asc" },
    });
  }
  list() {
    return this.db.conversation.findMany({
      select: { id: true, visitorId: true, status: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
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
