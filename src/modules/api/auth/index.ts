import { Module } from '@nestjs/common';
import { AuthService } from './services';
import { AuthController } from './controllers';
import { JwtModule } from '@nestjs/jwt';
import { jwtExpiresIn, jwtSecret } from '@/config';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: jwtSecret,
      signOptions: { expiresIn: jwtExpiresIn as any },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [JwtModule],
})
export class AuthModule {}
