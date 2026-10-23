import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  UseFilters,
} from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { plainToInstance } from "class-transformer";
import { validateOrReject } from "class-validator";
import { Server, Socket } from "socket.io";
import { ChatService, Identity } from "./chat.service";
import { ConversationDto, JoinDto, MessageDto } from "./dto";
@Catch()
export class SocketErrors implements ExceptionFilter {
  catch(_error: unknown, host: ArgumentsHost) {
    host
      .switchToWs()
      .getClient<Socket>()
      .emit("error", "Request rejected. Check credentials and input.");
    const ack = host.getArgByIndex(2);
    if (typeof ack === "function")
      ack({ ok: false, error: "Request rejected" });
  }
}
@UseFilters(new SocketErrors())
@WebSocketGateway({ maxHttpBufferSize: 16384 })
export class ChatGateway implements OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private typingTimers = new Map<
    string,
    Map<string, ReturnType<typeof setTimeout>>
  >();
  constructor(private chat: ChatService) {}
  private async dto<T extends object>(
    type: new () => T,
    raw: unknown,
  ): Promise<T> {
    if (!raw || typeof raw !== "object" || Array.isArray(raw))
      throw new Error("Invalid payload");
    const dto = plainToInstance(type, raw);
    await validateOrReject(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    return dto;
  }
  private user(s: Socket): Identity | undefined {
    return s.data.user;
  }
  private online() {
    return [
      ...new Set(
        [...this.server.sockets.sockets.values()]
          .map((s) => this.user(s))
          .filter((u) => u?.role === "visitor")
          .map((u) => u!.conversationId!),
      ),
    ];
  }
  @SubscribeMessage("user_join")
  async join(@ConnectedSocket() s: Socket, @MessageBody() raw: unknown) {
    if (this.user(s) || s.data.joining) throw new Error("Already joined");
    s.data.joining = true;
    try {
      const result = await this.chat.join(await this.dto(JoinDto, raw));
      s.data.user = result.identity;
      if (result.identity.role === "admin") await s.join("operators");
      else await s.join(`conv:${result.identity.conversationId}`);
      const conversations =
        result.identity.role === "admin" ? await this.chat.list() : [];
      const history = result.identity.conversationId
        ? (await this.chat.history(result.identity.conversationId)).map((m) =>
            this.chat.format(m),
          )
        : [];
      this.server.to("operators").emit("conversations", await this.chat.list());
      this.server.to("operators").emit("visitors_online", this.online());
      return {
        ok: true,
        ...result,
        conversations,
        history,
        online: result.identity.role === "admin" ? this.online() : [],
      };
    } finally {
      s.data.joining = false;
    }
  }
  @SubscribeMessage("select_conversation")
  async select(@ConnectedSocket() s: Socket, @MessageBody() raw: unknown) {
    const dto = await this.dto(ConversationDto, raw);
    await this.chat.authorize(this.user(s), dto.conversationId);
    return {
      ok: true,
      history: (await this.chat.history(dto.conversationId)).map((m) =>
        this.chat.format(m),
      ),
    };
  }
  @SubscribeMessage("send_message")
  async send(@ConnectedSocket() s: Socket, @MessageBody() raw: unknown) {
    const dto = await this.dto(MessageDto, raw);
    if (!dto.content.trim()) throw new Error("Empty message");
    const user = this.user(s);
    await this.chat.authorize(user, dto.conversationId);
    const message = this.chat.format(await this.chat.save(user!, dto));
    this.server
      .to(`conv:${dto.conversationId}`)
      .to("operators")
      .emit("receive_message", message);
    return { ok: true, message };
  }
  private async typing(s: Socket, raw: unknown, event: string) {
    const dto = await this.dto(ConversationDto, raw);
    await this.chat.authorize(this.user(s), dto.conversationId);
    const payload = {
      id: this.user(s)!.id,
      conversationId: dto.conversationId,
    };
    const timers = this.typingTimers.get(s.id) || new Map();
    clearTimeout(timers.get(dto.conversationId));
    timers.delete(dto.conversationId);
    if (event === "user_typing")
      timers.set(
        dto.conversationId,
        setTimeout(() => {
          s.to(`conv:${dto.conversationId}`)
            .to("operators")
            .emit("user_stopped_typing", payload);
          timers.delete(dto.conversationId);
        }, 5000),
      );
    this.typingTimers.set(s.id, timers);
    s.to(`conv:${dto.conversationId}`).to("operators").emit(event, payload);
    return { ok: true };
  }
  @SubscribeMessage("typing_start")
  start(@ConnectedSocket() s: Socket, @MessageBody() raw: unknown) {
    return this.typing(s, raw, "user_typing");
  }
  @SubscribeMessage("typing_stop")
  stop(@ConnectedSocket() s: Socket, @MessageBody() raw: unknown) {
    return this.typing(s, raw, "user_stopped_typing");
  }
  handleDisconnect(s: Socket) {
    const user = this.user(s);
    const timers = this.typingTimers.get(s.id);
    timers?.forEach((timer, id) => {
      clearTimeout(timer);
      this.server
        .to(`conv:${id}`)
        .to("operators")
        .emit("user_stopped_typing", { id: user?.id, conversationId: id });
    });
    this.typingTimers.delete(s.id);
    if (user?.conversationId)
      this.server
        .to(`conv:${user.conversationId}`)
        .to("operators")
        .emit("user_stopped_typing", {
          id: user.id,
          conversationId: user.conversationId,
        });
    this.server.to("operators").emit("visitors_online", this.online());
  }
}
