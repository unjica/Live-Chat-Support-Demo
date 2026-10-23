import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { ConsoleLogger, INestApplicationContext } from "@nestjs/common";
import { ServerOptions } from "socket.io";
import { AppModule } from "./app.module";
export class OriginAdapter extends IoAdapter {
  private attempts = new Map<string, { count: number; reset: number }>();
  constructor(app: INestApplicationContext) {
    super(app);
  }
  createIOServer(port: number, options?: ServerOptions) {
    const origins = (process.env.FRONTEND_URL || "http://localhost:3000")
      .split(",")
      .map((s) => s.trim());
    return super.createIOServer(port, {
      ...options,
      cors: { origin: origins },
      allowRequest: (
        req: { headers: { origin?: string }; socket: { remoteAddress?: string } },
        done: (err: string | null, ok: boolean) => void,
      ) => {
        const now = Date.now();
        for (const [ip, bucket] of this.attempts) {
          if (bucket.reset <= now) this.attempts.delete(ip);
        }
        // Use the peer address, never untrusted X-Forwarded-For headers.
        const ip = req.socket.remoteAddress || "unknown";
        let bucket = this.attempts.get(ip);
        if (!bucket) {
          if (this.attempts.size >= 10000) return done(null, false);
          bucket = { count: 0, reset: now + 60000 };
          this.attempts.set(ip, bucket);
        }
        done(null, ++bucket.count <= 60 && (!req.headers.origin || origins.includes(req.headers.origin)));
      },
    });
  }
}
export async function createApp() {
  const app = await NestFactory.create(AppModule, {
    abortOnError: false,
    logger: process.env.NODE_ENV === "test" ? false : new ConsoleLogger({ json: true }),
  });
  app.useWebSocketAdapter(new OriginAdapter(app));
  app.enableShutdownHooks();
  return app;
}
if (require.main === module)
  void createApp().then((app) =>
    app.listen(process.env.PORT || 3001, process.env.HOST || "0.0.0.0"),
  );
