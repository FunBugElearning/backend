import { Resolver, Mutation, Query, Args, Context } from '@nestjs/graphql';
import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { Auth, AuthUser } from './entities/auth.entity';
import { LoginAuthInput } from './dto/login-auth.input';
import { RegisterAuthInput } from './dto/register-auth.input';
import { getSessionMetadata } from '../utils/agent.utils';
import { verifyAuthenticatedUser } from '../middleware/role-authorization.middleware';
import { PrismaService } from 'src/prisma/prisma.service';

@Resolver(() => Auth)
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Mutation(() => Auth)
  loginAuth(
    @Args('loginAuthInput') loginAuthInput: LoginAuthInput,
    @Context('req') req: Request,
  ) {
    const sessionMetadata = getSessionMetadata(req);

    return this.authService.login(loginAuthInput, sessionMetadata);
  }

  @Mutation(() => Auth)
  registerAuth(
    @Args('registerAuthInput') registerAuthInput: RegisterAuthInput,
    @Context('req') req: Request,
  ) {
    const sessionMetadata = getSessionMetadata(req);

    return this.authService.register(registerAuthInput, sessionMetadata);
  }

  @Mutation(() => Boolean)
  logout(@Args('refreshToken') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }

  @Mutation(() => Auth)
  refreshToken(
    @Args('refreshToken') refreshToken: string,
    @Context('req') req: Request,
  ) {
    const sessionMetadata = getSessionMetadata(req);

    return this.authService.refreshSession(refreshToken, sessionMetadata);
  }

  @Query(() => AuthUser)
  async me(@Context('req') req: Request) {
    const validation = await verifyAuthenticatedUser(req, this.prisma);

    if (!validation.ok) {
      throw new UnauthorizedException(validation.message);
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: validation.userId },
      include: { role: true },
    });

    return user;
  }
}
