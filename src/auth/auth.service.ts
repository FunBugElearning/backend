import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { LoginAuthInput } from './dto/login-auth.input';
import { RegisterAuthInput } from './dto/register-auth.input';
import { logger } from 'src/helper/logger';
import {
  comparePassword,
  hashPassword,
} from 'src/utils/password.utils';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  signAccessToken,
  signRefreshToken,
} from 'src/utils/jwt_session.utils';
import {
  validateLoginInput,
  validateRegisterInput,
} from 'src/middleware/auth-validation.middleware';
import type { SessionMetadata } from 'src/utils/agent.utils';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(
    loginAuthInput: LoginAuthInput,
    sessionMetadata: SessionMetadata,
  ) {
    try {
      const validation =
        validateLoginInput(loginAuthInput);

      if (!validation.ok) {
        return {
          success: false,
          message: validation.message,
        };
      }

      const { email, password } =
        validation.data;

      const user =
        await this.prisma.user.findUnique({
          where: {
            email,
          },
          include: {
            role: true,
          },
        });

      if (!user) {
        return {
          success: false,
          message: 'Invalid email',
        };
      }

      const isPasswordValid =
        await comparePassword(
          password,
          user.password,
        );

      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid password',
        };
      }

      const accessToken = signAccessToken({
        userId: user.id,
        name: user.name,
        email: user.email,
      });

      const refreshToken = signRefreshToken({
        userId: user.id,
        name: user.name,
        email: user.email,
      });

      const hashedRefreshToken =
        await hashPassword(refreshToken);

      const now = new Date();

      const sessionTtlMs =
        this.parseDurationToMs(
          process.env.REFRESH_TOKEN_EXPIRATION ??
            '30d',
        );

      const expiredAt = new Date(
        now.getTime() + sessionTtlMs,
      );

      await this.prisma.authSession.create({
        data: {
          user_id: user.id,
          refresh_toke_hash:
            hashedRefreshToken,
          browser_agent:
            sessionMetadata.browser_agent,
          ip_address:
            sessionMetadata.ip_address,
          expired_at: expiredAt,
          rotated_at: now,
          revoked_at: null,
          created_at: now,
          family_id: randomUUID(),
          jti: randomUUID(),
        },
      });

      return {
        success: true,
        message: 'Login successful',
        user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error('Login failed', {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Login failed unexpectedly',
      };
    }
  }

  async register(
    registerAuthInput: RegisterAuthInput,
    sessionMetadata: SessionMetadata,
  ) {
    try {
      const validation =
        validateRegisterInput(registerAuthInput);

      if (!validation.ok) {
        return {
          success: false,
          message: validation.message,
        };
      }

      const {
        name,
        email,
        password,
        dateOfBirth,
        address,
        phoneNumber,
        role,
      } = validation.data;

      const existingUser =
        await this.prisma.user.findUnique({
          where: {
            email,
          },
        });

      if (existingUser) {
        return {
          success: false,
          message: 'Email is already in use',
        };
      }

      const hashedPassword =
        await hashPassword(password);

      const roleId =
        await this.resolveRoleId(role);

      const user =
        await this.prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            dateOfBirth,
            address,
            phoneNumber,
            role: {
              connect: {
                id: roleId,
              },
            },
          },
          include: {
            role: true,
          },
        });

      const accessToken = signAccessToken({
        userId: user.id,
        name: user.name,
        email: user.email,
      });

      const refreshToken = signRefreshToken({
        userId: user.id,
        name: user.name,
        email: user.email,
      });

      const hashedRefreshToken =
        await hashPassword(refreshToken);

      const now = new Date();

      const sessionTtlMs =
        this.parseDurationToMs(
          process.env.REFRESH_TOKEN_EXPIRATION ??
            '30d',
        );

      const expiredAt = new Date(
        now.getTime() + sessionTtlMs,
      );

      await this.prisma.authSession.create({
        data: {
          user_id: user.id,
          refresh_toke_hash:
            hashedRefreshToken,
          browser_agent:
            sessionMetadata.browser_agent,
          ip_address:
            sessionMetadata.ip_address,
          expired_at: expiredAt,
          rotated_at: now,
          revoked_at: null,
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
      logger.error('Register failed', {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });

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
    const match =
      /^(\d+)([smhd])$/i.exec(value.trim());

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

  private async resolveRoleId(
    roleName?: string,
  ): Promise<number> {
    const normalizedRole =
      roleName?.toLowerCase() || 'student';

    const allowedRoles = [
      'admin',
      'teacher',
      'student',
    ];

    if (!allowedRoles.includes(normalizedRole)) {
      throw new BadRequestException(
        'Role must be admin, teacher, or student',
      );
    }

    const roleDescriptions = {
      admin: 'Admin role',
      teacher: 'Teacher role',
      student: 'Default student role',
    };

    const role =
      await this.prisma.role.upsert({
        where: {
          name: normalizedRole,
        },
        update: {},
        create: {
          name: normalizedRole,
          description:
            roleDescriptions[
              normalizedRole as keyof typeof roleDescriptions
            ],
        },
      });

    return role.id;
  }
}