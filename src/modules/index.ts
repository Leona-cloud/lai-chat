import { Module } from '@nestjs/common';
import { ApiModule } from './api';
import { CoreModule } from './core';

@Module({
  imports: [ApiModule, CoreModule],
})
export class AppModule {}
