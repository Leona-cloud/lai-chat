import { Module } from '@nestjs/common';
import { ChatModule } from './chat';
import { AuthModule } from './auth';

@Module({
  imports: [AuthModule, ChatModule],
})
export class ApiModule {}
