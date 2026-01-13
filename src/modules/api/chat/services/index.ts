import { PrismaService } from '@/modules/core/prisma/services';
import { ConversationType, User } from '@prisma/client';
import { JoinChatDto } from '../dtos';
import { JoinChatError } from '../errors';
import { HttpStatus, Injectable } from '@nestjs/common';
import { buildResponse } from '@/utils';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async startChat(user: User, options: JoinChatDto) {
    if (user.id === options.userId) {
      throw new JoinChatError(
        'User cannot chat with self',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingChat = await this.prisma.conversation.findFirst({
      where: {
        type: ConversationType.DIRECT,
        participants: { every: { userId: { in: [user.id, options.userId] } } },
      },
      include: { participants: true },
    });
    console.log(existingChat)
    if (existingChat)
      return buildResponse({
        message: 'Chat started successfully',
        data: existingChat,
      });

    const newChat = await this.prisma.conversation.create({
      data: {
        type: ConversationType.DIRECT,
        participants: {
          create: [{ userId: user.id }, { userId: options.userId }],
        },
      },
      include: { participants: true },
    });

    return buildResponse({
      message: 'Chat started successfully',
      data: {
        conversationId: newChat.id,
        participants: newChat.participants.map((p) => p.userId),
      },
    });
  }

  async isParticipant(
    conversationId: string,
    userId: number,
  ): Promise<boolean> {
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    return !!participant;
  }
}
