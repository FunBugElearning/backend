import { Injectable } from '@nestjs/common';
import { LoginAuthInput } from './dto/login-auth.input';
import { RegisterAuthInput } from './dto/register-auth.input';
import { validateEmptyFields } from 'src/utils/validator';
import { logger } from 'src/helper/logger';
import { hashPassword } from 'src/utils/password.utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { signAccessToken, signRefreshToken } from 'src/utils/jwt_session.utils';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) { }

  login(loginAuthInput: LoginAuthInput) {
    return 'This action adds a new auth';
  }

  async register(registerAuthInput: RegisterAuthInput) {
    try {
      const { name, email, password, dateOfBirth, address, phoneNumber } = registerAuthInput;

      const validateResult = validateEmptyFields(registerAuthInput);

      if (validateResult.length > 0) {
        logger.error(`Empty fields: ${validateResult.join(', ')}`);
        throw new Error(`Empty fields: ${validateResult.join(', ')}`)
      }

      const hashedPassword = await hashPassword(password);

      const user = await this.prisma.user.create({
        data: { name, email, password: hashedPassword, dateOfBirth, address, phoneNumber },
      });

      const accessToken = await signAccessToken({
        userId: user.id,
        name: user.name,
        email: user.email,
      })

      const refreshToken = await signRefreshToken({
        userId: user.id,
        name: user.name,
        email: user.email,
      })

      const hashedRefreshToken = await hashPassword(refreshToken);

      await this.prisma.authSession.create({
        data: {
          userId: user.id,
          accessToken,
          refreshToken: hashedRefreshToken,
        }
      });

      return {
        success: true,
        message: 'User registered successfully',
        user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      }
    }

  }
}
