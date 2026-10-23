import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { ConsoleLogger, INestApplicationContext } from "@nestjs/common";
import { ServerOptions } from "socket.io";
import { AppModule } from "./app.module";
import { clientIp, securityHeaders, trustedProxyHops } from "./security";
export class OriginAdapter extends IoAdapter {
  private attempts = new Map<string, { count: number; reset: number }>();
  constructor(
    app: INestApplicationContext,
    private readonly hops = trustedProxyHops(),
  ) {
    super(app);
  }
  createIOServer(port: number, options?: ServerOptions) {
    const origins = (process.env.FRONTEND_URL || "http://localhost:3000")
      .split(",")
      .map((s) => s.trim());
    const headers = securityHeaders();
    const server = super.createIOServer(port, {
      ...options,
      cors: { origin: origins },
      allowRequest: (
        req: {
          headers: { origin?: string; "x-forwarded-for"?: string | string[] };
          socket: { remoteAddress?: string };
        },
        done: (err: string | null, ok: boolean) => void,
      ) => {
        const now = Date.now();
        for (const [ip, bucket] of this.attempts) {
          if (bucket.reset <= now) this.attempts.delete(ip);
        }
        // X-Forwarded-For is only honoured for TRUST_PROXY_HOPS trusted proxies.
        const ip = clientIp(req.socket.remoteAddress, req.headers["x-forwarded-for"], this.hops);
        let bucket = this.attempts.get(ip);
        if (!bucket) {
          if (this.attempts.size >= 10000) return done(null, false);
          bucket = { count: 0, reset: now + 60000 };
          this.attempts.set(ip, bucket);
        }
        done(null, ++bucket.count <= 60 && (!req.headers.origin || origins.includes(req.headers.origin)));
      },
    });
    // Engine.IO answers /socket.io requests before Express middleware runs.
    const addHeaders = (h: Record<string, string>) => Object.assign(h, headers);
    server.engine.on("initial_headers", addHeaders);
    server.engine.on("headers", addHeaders);
    return server;
  }
}
export async function createApp() {
  const app = await NestFactory.create(AppModule, {
    abortOnError: false,
    logger: process.env.NODE_ENV === "test" ? false : new ConsoleLogger({ json: true }),
  });
  const hops = trustedProxyHops();
  const http = app.getHttpAdapter().getInstance();
  http.disable("x-powered-by");
  http.set("trust proxy", hops > 0 ? hops : false);
  const headers = securityHeaders();
  http.use((_req: unknown, res: { setHeader(k: string, v: string): void }, next: () => void) => {
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
    next();
  });
  app.useWebSocketAdapter(new OriginAdapter(app, hops));
  app.enableShutdownHooks();
  return app;
}
if (require.main === module)
  void createApp().then((app) =>
    app.listen(process.env.PORT || 3001, process.env.HOST || "0.0.0.0"),
  );
