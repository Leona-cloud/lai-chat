import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ChatService } from '../services';
import { AuthGuard } from '../../auth/guards';
import { JoinChatDto } from '../dtos';
import { User } from '@/modules/user/decorators';
import { User as UserModel } from '@prisma/client';

@UseGuards(AuthGuard)
@Controller({
  path: 'chat',
})
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('start')
  async joinChat(@Body() dto: JoinChatDto, @User() user: UserModel) {
    return await this.chatService.startChat(user, dto);
  }

  @Get('messages')
  async fetchMessages(
    @Query('userId') userId: string,
    @User() user: UserModel,
  ) {
    return await this.chatService.fetchMessages(user, userId);
  }

  @Get('conversations')
  async fetchConversations(@User() user) {
    return await this.chatService.fetchUsersInConversations(user);
  }
}
