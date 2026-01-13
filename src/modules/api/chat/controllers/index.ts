import { Body, Controller, Post, UseGuards } from '@nestjs/common';
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
}
