import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { LoginAuthInput } from './dto/login-auth.input';
import { RegisterAuthInput } from './dto/register-auth.input';
import { logger } from '../helper/logger';
import { comparePassword, hashPassword } from '../utils/password.utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { IdSequenceService } from 'src/prisma/id-sequence.service';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt_session.utils';
import {
  validateLoginInput,
  validateRegisterInput,
} from 'src/middleware/auth-validation.middleware';
import type { SessionMetadata } from '../utils/agent.utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idSequence: IdSequenceService,
  ) {}

  async login(
    loginAuthInput: LoginAuthInput,
    sessionMetadata: SessionMetadata,
  ) {
    try {
      const validation = validateLoginInput(loginAuthInput);

      if (!validation.ok) {
        return {
          success: false,
          message: validation.message,
        };
      }

      const { email, password } = validation.data;

      const user = await this.prisma.user.findUnique({
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

      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid password',
        };
      }

      const jti = randomUUID();

      const accessToken = signAccessToken({
        userId: user.id,
        name: user.name,
        email: user.email,
        jti,
      });

      const refreshToken = signRefreshToken({
        userId: user.id,
        name: user.name,
        email: user.email,
        jti,
      });

      const hashedRefreshToken = await hashPassword(refreshToken);

      const now = new Date();

      const sessionTtlMs = this.parseDurationToMs(
        process.env.REFRESH_TOKEN_EXPIRATION ?? '30d',
      );

      const expiredAt = new Date(now.getTime() + sessionTtlMs);

      await this.prisma.authSession.create({
        data: {
          id: await this.idSequence.next('AuthSession'),
          user_id: user.id,
          refresh_toke_hash: hashedRefreshToken,
          browser_agent: sessionMetadata.browser_agent,
          ip_address: sessionMetadata.ip_address,
          expired_at: expiredAt,
          rotated_at: now,
          revoked_at: null,
          created_at: now,
          family_id: randomUUID(),
          jti,
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
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Login failed unexpectedly',
      };
    }
  }

  async register(
    registerAuthInput: RegisterAuthInput,
    sessionMetadata: SessionMetadata,
  ) {
    try {
      const validation = validateRegisterInput(registerAuthInput);

      if (!validation.ok) {
        return {
          success: false,
          message: validation.message,
        };
      }

      const { name, email, password, dateOfBirth, address, phoneNumber } =
        validation.data;

      const existingUser = await this.prisma.user.findUnique({
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

      const hashedPassword = await hashPassword(password);

      // Public registration must never honor a client-supplied role — it always
      // creates a student account. Admin/teacher accounts are created only via an
      // authenticated admin-only path (see UsersModule).
      const roleId = await this.resolveRoleId('student');

      const user = await this.prisma.user.create({
        data: {
          id: await this.idSequence.next('User'),
          name,
          nameLower: name.toLowerCase(),
          email,
          emailLower: email.toLowerCase(),
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

      const jti = randomUUID();

      const accessToken = signAccessToken({
        userId: user.id,
        name: user.name,
        email: user.email,
        jti,
      });

      const refreshToken = signRefreshToken({
        userId: user.id,
        name: user.name,
        email: user.email,
        jti,
      });

      const hashedRefreshToken = await hashPassword(refreshToken);

      const now = new Date();

      const sessionTtlMs = this.parseDurationToMs(
        process.env.REFRESH_TOKEN_EXPIRATION ?? '30d',
      );

      const expiredAt = new Date(now.getTime() + sessionTtlMs);

      await this.prisma.authSession.create({
        data: {
          id: await this.idSequence.next('AuthSession'),
          user_id: user.id,
          refresh_toke_hash: hashedRefreshToken,
          browser_agent: sessionMetadata.browser_agent,
          ip_address: sessionMetadata.ip_address,
          expired_at: expiredAt,
          rotated_at: now,
          revoked_at: null,
          created_at: now,
          family_id: randomUUID(),
          jti,
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
        error: error instanceof Error ? error.message : String(error),
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

  async logout(refreshToken: string): Promise<boolean> {
    try {
      const payload = verifyRefreshToken(refreshToken) as {
        userId?: unknown;
        jti?: unknown;
      };
      const userId = Number(payload.userId);

      if (!Number.isInteger(userId) || userId <= 0) {
        return false;
      }

      const session = await this.findSessionByRefreshToken(
        userId,
        payload.jti,
        refreshToken,
      );

      if (!session) {
        return false;
      }

      await this.prisma.authSession.update({
        where: { id: session.id },
        data: { revoked_at: new Date() },
      });

      return true;
    } catch (error) {
      logger.error('Logout failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  async refreshSession(refreshToken: string, sessionMetadata: SessionMetadata) {
    try {
      const payload = verifyRefreshToken(refreshToken) as {
        userId?: unknown;
        jti?: unknown;
      };
      const userId = Number(payload.userId);

      if (!Number.isInteger(userId) || userId <= 0) {
        return { success: false, message: 'Invalid refresh token' };
      }

      const session = await this.findSessionByRefreshToken(
        userId,
        payload.jti,
        refreshToken,
      );

      if (!session) {
        return {
          success: false,
          message: 'Refresh token is invalid, expired, or already used',
        };
      }

      const now = new Date();

      if (session.expired_at < now) {
        return { success: false, message: 'Refresh token has expired' };
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (!user) {
        return { success: false, message: 'User is not found' };
      }

      const newJti = randomUUID();

      const newAccessToken = signAccessToken({
        userId: user.id,
        name: user.name,
        email: user.email,
        jti: newJti,
      });

      const newRefreshToken = signRefreshToken({
        userId: user.id,
        name: user.name,
        email: user.email,
        jti: newJti,
      });

      const hashedRefreshToken = await hashPassword(newRefreshToken);

      const sessionTtlMs = this.parseDurationToMs(
        process.env.REFRESH_TOKEN_EXPIRATION ?? '30d',
      );

      // Rotate: revoke the old session and issue a fresh one under the same
      // family, so reuse of a revoked refresh token is detectable later if
      // reuse-detection is added.
      const newSessionId = await this.idSequence.next('AuthSession');

      await this.prisma.$transaction([
        this.prisma.authSession.update({
          where: { id: session.id },
          data: { revoked_at: now },
        }),
        this.prisma.authSession.create({
          data: {
            id: newSessionId,
            user_id: user.id,
            refresh_toke_hash: hashedRefreshToken,
            browser_agent: sessionMetadata.browser_agent,
            ip_address: sessionMetadata.ip_address,
            expired_at: new Date(now.getTime() + sessionTtlMs),
            rotated_at: now,
            revoked_at: null,
            created_at: now,
            family_id: session.family_id,
            jti: newJti,
          },
        }),
      ]);

      return {
        success: true,
        message: 'Token refreshed',
        user,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      logger.error('Refresh failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Refresh failed unexpectedly',
      };
    }
  }

  // Looks up the exact session a raw refresh token belongs to. Every token
  // minted by login/register/refreshSession carries a unique `jti` claim
  // matching its AuthSession row, so this resolves in one indexed lookup
  // instead of scanning every active session for the user. Falls back to a
  // hash-comparison scan for tokens issued before the jti claim existed.
  // Either way, the raw token is still verified against the stored bcrypt
  // hash before the session is trusted.
  private async findSessionByRefreshToken(
    userId: number,
    jti: unknown,
    rawToken: string,
  ) {
    if (typeof jti === 'string' && jti.length > 0) {
      const session = await this.prisma.authSession.findUnique({
        where: { jti },
      });

      if (
        session &&
        session.user_id === userId &&
        session.revoked_at === null &&
        (await comparePassword(rawToken, session.refresh_toke_hash))
      ) {
        return session;
      }

      return null;
    }

    const candidateSessions = await this.prisma.authSession.findMany({
      where: { user_id: userId, revoked_at: null },
    });

    for (const session of candidateSessions) {
      const matches = await comparePassword(
        rawToken,
        session.refresh_toke_hash,
      );

      if (matches) {
        return session;
      }
    }

    return null;
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

  private async resolveRoleId(roleName?: string): Promise<number> {
    const normalizedRole = roleName?.toLowerCase() || 'student';

    const allowedRoles = ['admin', 'teacher', 'student'];

    if (!allowedRoles.includes(normalizedRole)) {
      throw new BadRequestException('Role must be admin, teacher, or student');
    }

    const roleDescriptions = {
      admin: 'Admin role',
      teacher: 'Teacher role',
      student: 'Default student role',
    };

    const existingRole = await this.prisma.role.findUnique({
      where: { name: normalizedRole },
    });

    if (existingRole) {
      return existingRole.id;
    }

    const role = await this.prisma.role.create({
      data: {
        id: await this.idSequence.next('Role'),
        name: normalizedRole,
        description:
          roleDescriptions[normalizedRole as keyof typeof roleDescriptions],
      },
    });

    return role.id;
  }
}
