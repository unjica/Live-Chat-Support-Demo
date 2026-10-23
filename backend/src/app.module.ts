import { Controller, Get, Module, ServiceUnavailableException } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";
import { PrismaService } from "./prisma.service";
@Controller()
class HealthController {
  constructor(private db: PrismaService) {}
  @Get() async health() {
    try {
      await this.db.$queryRaw`SELECT 1`;
      return { status: "ok" };
    } catch {
      throw new ServiceUnavailableException("Database unavailable");
    }
  }
}
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => {
        if (
          !env.DATABASE_URL ||
          !env.OPERATOR_SECRET ||
          env.OPERATOR_SECRET.length < 32 ||
          (env.NODE_ENV === "production" && (
            env.OPERATOR_SECRET.startsWith("replace-") || !env.FRONTEND_URL ||
            env.FRONTEND_URL.split(",").some((origin: string) => {
              try { return new URL(origin.trim()).origin !== origin.trim(); } catch { return true; }
            })
          ))
        )
          throw new Error(
            "Configure DATABASE_URL, OPERATOR_SECRET (32+ characters) and production FRONTEND_URL",
          );
        return env;
      },
    }),
  ],
  controllers: [HealthController],
  providers: [PrismaService, ChatService, ChatGateway],
})
export class AppModule {}
