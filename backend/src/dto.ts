import { IsIn, IsOptional, IsString, IsUUID, Length } from "class-validator";
export class JoinDto {
  @IsIn(["visitor", "admin"]) role!: "visitor" | "admin";
  @IsOptional() @IsString() @Length(1, 256) token?: string;
  @IsOptional() @IsString() @Length(1, 256) secret?: string;
}
export class ConversationDto {
  @IsUUID() conversationId!: string;
}
export class MessageDto extends ConversationDto {
  @IsUUID() clientMessageId!: string;
  @IsString() @Length(1, 4000) content!: string;
}
