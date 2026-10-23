import { Controller, Get, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";
import { PrismaService } from "./prisma.service";
@Controller()
class HealthController {
  @Get() health() {
    return { status: "ok" };
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
          env.OPERATOR_SECRET.length < 32
        )
          throw new Error(
            "DATABASE_URL and OPERATOR_SECRET (32+ characters) required",
          );
        return env;
      },
    }),
  ],
  controllers: [HealthController],
  providers: [PrismaService, ChatService, ChatGateway],
})
export class AppModule {}
