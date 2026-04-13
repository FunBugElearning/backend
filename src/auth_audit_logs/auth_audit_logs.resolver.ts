import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { AuthAuditLogsService } from './auth_audit_logs.service';
import { AuthAuditLog } from './entities/auth_audit_log.entity';
import { CreateAuthAuditLogInput } from './dto/create-auth_audit_log.input';
import { UpdateAuthAuditLogInput } from './dto/update-auth_audit_log.input';

@Resolver(() => AuthAuditLog)
export class AuthAuditLogsResolver {
  constructor(private readonly authAuditLogsService: AuthAuditLogsService) {}

  @Mutation(() => AuthAuditLog)
  createAuthAuditLog(
    @Args('createAuthAuditLogInput')
    createAuthAuditLogInput: CreateAuthAuditLogInput,
  ) {
    return this.authAuditLogsService.create(createAuthAuditLogInput);
  }

  @Query(() => [AuthAuditLog], { name: 'authAuditLogs' })
  findAll() {
    return this.authAuditLogsService.findAll();
  }

  @Query(() => AuthAuditLog, { name: 'authAuditLog' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.authAuditLogsService.findOne(id);
  }

  @Mutation(() => AuthAuditLog)
  updateAuthAuditLog(
    @Args('updateAuthAuditLogInput')
    updateAuthAuditLogInput: UpdateAuthAuditLogInput,
  ) {
    return this.authAuditLogsService.update(
      updateAuthAuditLogInput.id,
      updateAuthAuditLogInput,
    );
  }

  @Mutation(() => AuthAuditLog)
  removeAuthAuditLog(@Args('id', { type: () => Int }) id: number) {
    return this.authAuditLogsService.remove(id);
  }
}
