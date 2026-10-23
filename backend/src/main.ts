import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { INestApplicationContext } from "@nestjs/common";
import { ServerOptions } from "socket.io";
import { AppModule } from "./app.module";
export class OriginAdapter extends IoAdapter {
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
        req: { headers: { origin?: string } },
        done: (err: string | null, ok: boolean) => void,
      ) =>
        done(null, !req.headers.origin || origins.includes(req.headers.origin)),
    });
  }
}
export async function createApp() {
  const app = await NestFactory.create(AppModule, {
    abortOnError: false,
    logger: process.env.NODE_ENV === "test" ? false : undefined,
  });
  app.useWebSocketAdapter(new OriginAdapter(app));
  app.enableShutdownHooks();
  return app;
}
if (require.main === module)
  void createApp().then((app) =>
    app.listen(process.env.PORT || 3001, process.env.HOST || "0.0.0.0"),
  );
