import { PrismaService } from '@/modules/core/prisma/services';
import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import {
  InvalidUserCredentialException,
  UserAlreadyRegisteredException,
} from '../errors';
import { buildResponse, generateId } from '@/utils';
import { SignInDto, SignUpDto } from '../dtos';
import { LoginMeta } from '../interfaces';
import { refreshJwtSecret, refreshTokenExpiresIn } from '@/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

   private async generateJwtTokens(userId: string) {
    const accessToken = await this.jwtService.signAsync({
      sub: userId,
    });

    const refreshToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: refreshJwtSecret,
        expiresIn: refreshTokenExpiresIn as any,
      },
    );

    return { accessToken, refreshToken };
  }

  async signUp(options: SignUpDto): Promise<ApiResponse> {
    const email = options.email.toLowerCase().trim();

    const user = await this.prisma.user.findFirst({
      where: {
        email: options.email.toLowerCase().trim(),
      },
    });

    if (user) {
      throw new UserAlreadyRegisteredException(
        'An account with this email already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    const hashedPassword = await this.hashPassword(options.password);

    const newUser = await this.prisma.user.create({
      data: {
        identifier: generateId({ type: 'identifier' }),
        firstName: options.firstName,
        lastName: options.lastName,
        email: options.email.toLowerCase().trim(),
        password: hashedPassword,
      },
    });

    return buildResponse({
      message: `User registered successfully.`,
    });
  }

  async signIn(options: SignInDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: options.email.toLowerCase().trim(),
      },
      select: {
        id: true,
        identifier: true,
        firstName: true,
        lastName: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      throw new InvalidUserCredentialException(
        'Invalid credentials',
        HttpStatus.BAD_REQUEST,
      );
    }

    const validPassword = await this.comparePassword(
      options.password,
      user.password,
    );

    if (!validPassword) {
      throw new InvalidUserCredentialException(
        'Invalid credentials',
        HttpStatus.BAD_REQUEST,
      );
    }

    const { accessToken, refreshToken } = await this.generateJwtTokens(
      user.identifier,
    );

    const loginData: LoginMeta = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };

    return buildResponse({
      message: 'User Logged in successfully',
      data: {
        accessToken,
        refreshToken,
        meta: loginData,
      },
    });
  }
}
