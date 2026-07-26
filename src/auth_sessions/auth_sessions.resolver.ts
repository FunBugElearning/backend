import { Resolver, Query, Mutation, Args, Context, Int } from '@nestjs/graphql';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthSessionsService } from './auth_sessions.service';
import { AuthSession } from './entities/auth_session.entity';
import { UpdateAuthSessionInput } from './dto/update-auth_session.input';
import { PrismaService } from '../prisma/prisma.service';
import { verifyAdminRole } from '../middleware/role-authorization.middleware';

// NOTE: this module's service is still an unfinished scaffold (placeholder
// responses, not wired to the real AuthSession table used by login/register).
// Locked to admin-only pending either finishing or removing it — see
// .claude/KNOWN_ISSUES.md.
@Resolver(() => AuthSession)
export class AuthSessionsResolver {
  constructor(
    private readonly authSessionsService: AuthSessionsService,
    private readonly prisma: PrismaService,
  ) {}

  private async assertAdmin(req: Request): Promise<void> {
    const validation = await verifyAdminRole(req, this.prisma);

    if (validation.ok) {
      return;
    }

    if (validation.status === 'unauthorized') {
      throw new UnauthorizedException(validation.message);
    }

    throw new ForbiddenException(validation.message);
  }

  @Mutation(() => AuthSession)
  async createAuthSession(@Context('req') req: Request) {
    await this.assertAdmin(req);
    return this.authSessionsService.create();
  }

  @Query(() => [AuthSession], { name: 'authSessions' })
  async findAll(@Context('req') req: Request) {
    await this.assertAdmin(req);
    return this.authSessionsService.findAll();
  }

  @Query(() => AuthSession, { name: 'authSession' })
  async findOne(
    @Args('id', { type: () => Int }) id: number,
    @Context('req') req: Request,
  ) {
    await this.assertAdmin(req);
    return this.authSessionsService.findOne(id);
  }

  @Mutation(() => AuthSession)
  async updateAuthSession(
    @Args('updateAuthSessionInput')
    updateAuthSessionInput: UpdateAuthSessionInput,
    @Context('req') req: Request,
  ) {
    await this.assertAdmin(req);
    return this.authSessionsService.update(updateAuthSessionInput.id);
  }

  @Mutation(() => AuthSession)
  async removeAuthSession(
    @Args('id', { type: () => Int }) id: number,
    @Context('req') req: Request,
  ) {
    await this.assertAdmin(req);
    return this.authSessionsService.remove(id);
  }
}
