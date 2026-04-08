import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { LoginAuthInput } from './dto/login-auth.input';
import { RegisterAuthInput } from './dto/register-auth.input';
import { validateEmptyFields } from 'src/utils/validator';
import { logger } from 'src/helper/logger';
import { hashPassword } from 'src/utils/password.utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { signAccessToken, signRefreshToken } from 'src/utils/jwt_session.utils';

type SessionMetadata = {
  browser_agent: string;
  ip_address: string;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  login(loginAuthInput: LoginAuthInput) {
    return 'This action adds a new auth';
  }

  async register(
    registerAuthInput: RegisterAuthInput,
    sessionMetadata: SessionMetadata,
  ) {
    try {
      const { name, email, password, dateOfBirth, address, phoneNumber } =
        registerAuthInput;

      const validateResult = validateEmptyFields({
        name,
        email,
        password,
        dateOfBirth,
      });

      if (validateResult.length > 0) {
        logger.error(`Empty fields: ${validateResult.join(', ')}`);
        throw new Error(`Empty fields: ${validateResult.join(', ')}`);
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return {
          success: false,
          message: 'Email is already in use',
        };
      }

      const hashedPassword = await hashPassword(password);

      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          dateOfBirth,
          address,
          phoneNumber,
        },
      });

      const accessToken = await signAccessToken({
        userId: user.id,
        name: user.name,
        email: user.email,
      });

      const refreshToken = await signRefreshToken({
        userId: user.id,
        name: user.name,
        email: user.email,
      });

      const hashedRefreshToken = await hashPassword(refreshToken);
      const now = new Date();
      const sessionTtlMs = this.parseDurationToMs(
        process.env.REFRESH_TOKEN_EXPIRATION ?? '21d',
      );
      const expiredAt = new Date(now.getTime() + sessionTtlMs);

      await this.prisma.authSession.create({
        data: {
          user_id: user.id,
          refresh_toke_hash: hashedRefreshToken,
          browser_agent: sessionMetadata.browser_agent,
          ip_address: sessionMetadata.ip_address,
          expired_at: expiredAt,
          rotated_at: now,
          revoked_at: now,
          created_at: now,
          family_id: randomUUID(),
          jti: randomUUID(),
        },
      });

      return {
        success: true,
        message: 'User registered successfully',
        user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error('Register failed', { error });

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Register failed unexpectedly',
      };
    }
  }

  private parseDurationToMs(value: string): number {
    const match = /^(\d+)([smhd])$/i.exec(value.trim());

    if (!match) {
      return 21 * 24 * 60 * 60 * 1000;
    }

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();

    if (unit === 's') {
      return amount * 1000;
    }

    if (unit === 'm') {
      return amount * 60 * 1000;
    }

    if (unit === 'h') {
      return amount * 60 * 60 * 1000;
    }

    return amount * 24 * 60 * 60 * 1000;
  }
}
