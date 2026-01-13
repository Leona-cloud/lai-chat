import { MessageType } from '@prisma/client';
import { IsEnum, IsNumber, IsString } from 'class-validator';

export class JoinChatDto {
  @IsNumber()
  userId: number;
}


export class SendMessageDto {
  @IsString()
  conversationId: string;

  @IsString()
  content: string;

  @IsEnum(MessageType)
  type: MessageType;
}
