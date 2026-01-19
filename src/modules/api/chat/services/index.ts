import { PrismaService } from '@/modules/core/prisma/services';
import { ConversationType, MessageType, User } from '@prisma/client';
import { JoinChatDto, SendMessageDto } from '../dtos';
import { InvalidConversationIdException, JoinChatError } from '../errors';
import { HttpStatus, Injectable } from '@nestjs/common';
import { buildResponse } from '@/utils';
import { UserNotFoundException } from '../../auth/errors';

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

  async sendMessage(user: User, options: SendMessageDto) {
    const conversation = await this.prisma.conversation.findUnique({
      where: {
        id: options.conversationId,
      },
    });

    if (!conversation) {
      throw new InvalidConversationIdException(
        'Conversation id is invalid.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const message = await this.prisma.message.create({
      data: {
        conversation: { connect: { id: conversation.id } },
        sender: { connect: { id: user.id } },
        content: options.content,
        type: options.type,
      },
    });

    await this.prisma.conversationMeta.upsert({
      where: { conversationId: conversation.id },
      update: {
        lastMessage: options.content,
        lastMessageAt: new Date(),
        lastSenderId: user.id,
      },
      create: {
        conversationId: options.conversationId,
        lastMessage: options.content,
        lastMessageAt: new Date(),
        lastSenderId: user.id,
      },
    });

    return buildResponse({
      message: 'Message sent successfully.',
      data: message,
    });
  }

  async fetchMessages(user: User, userId: string) {
    const participant = await this.prisma.user.findUnique({
      where: {
        identifier: userId,
      },
    });

    if (!participant) {
      throw new UserNotFoundException(
        'User not found.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const conversation = await this.prisma.conversation.findFirst({
      where: {
        type: ConversationType.DIRECT,
        participants: { every: { userId: { in: [user.id, participant.id] } } },
      },
    });

    if (!conversation) {
      return buildResponse({
        message: 'No messages found.',
      });
    }

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId: conversation.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return buildResponse({
      message: 'Messages fetched successfully.',
      data: messages,
    });
  }

  async fetchUsersInConversations(user: User) {
    const conversations = await this.prisma.conversationParticipant.findMany({
      where: {
        userId: user.id,
      },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    identifier: true,
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return buildResponse({
      message: 'Users fetched successfully.',
      data: conversations.map((c) => {
        const otherParticipants = c.conversation.participants
          .filter((p) => p.userId !== user.id)
          .map((p) => p.user);

        return {
          conversationId: c.conversation.id,
          users: otherParticipants,
        };
      }),
    });
  }
}
