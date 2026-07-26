import { Resolver, Query, Mutation, Args, Context, Int } from '@nestjs/graphql';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthAuditLogsService } from './auth_audit_logs.service';
import { AuthAuditLog } from './entities/auth_audit_log.entity';
import { CreateAuthAuditLogInput } from './dto/create-auth_audit_log.input';
import { UpdateAuthAuditLogInput } from './dto/update-auth_audit_log.input';
import { PrismaService } from '../prisma/prisma.service';
import { verifyAdminRole } from '../middleware/role-authorization.middleware';

// NOTE: this module's service is still an unfinished scaffold (placeholder
// responses, not wired to the real AuthAuditLog table). Locked to admin-only
// pending either finishing or removing it — see .claude/KNOWN_ISSUES.md.
@Resolver(() => AuthAuditLog)
export class AuthAuditLogsResolver {
  constructor(
    private readonly authAuditLogsService: AuthAuditLogsService,
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

  @Mutation(() => AuthAuditLog)
  async createAuthAuditLog(
    @Args('createAuthAuditLogInput')
    createAuthAuditLogInput: CreateAuthAuditLogInput,
    @Context('req') req: Request,
  ) {
    await this.assertAdmin(req);
    return this.authAuditLogsService.create(createAuthAuditLogInput);
  }

  @Query(() => [AuthAuditLog], { name: 'authAuditLogs' })
  async findAll(@Context('req') req: Request) {
    await this.assertAdmin(req);
    return this.authAuditLogsService.findAll();
  }

  @Query(() => AuthAuditLog, { name: 'authAuditLog' })
  async findOne(
    @Args('id', { type: () => Int }) id: number,
    @Context('req') req: Request,
  ) {
    await this.assertAdmin(req);
    return this.authAuditLogsService.findOne(id);
  }

  @Mutation(() => AuthAuditLog)
  async updateAuthAuditLog(
    @Args('updateAuthAuditLogInput')
    updateAuthAuditLogInput: UpdateAuthAuditLogInput,
    @Context('req') req: Request,
  ) {
    await this.assertAdmin(req);
    return this.authAuditLogsService.update(
      updateAuthAuditLogInput.id,
      updateAuthAuditLogInput,
    );
  }

  @Mutation(() => AuthAuditLog)
  async removeAuthAuditLog(
    @Args('id', { type: () => Int }) id: number,
    @Context('req') req: Request,
  ) {
    await this.assertAdmin(req);
    return this.authAuditLogsService.remove(id);
  }
}
