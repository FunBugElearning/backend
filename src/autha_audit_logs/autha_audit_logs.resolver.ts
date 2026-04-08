import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { AuthaAuditLogsService } from './autha_audit_logs.service';
import { AuthaAuditLog } from './entities/autha_audit_log.entity';
import { CreateAuthaAuditLogInput } from './dto/create-autha_audit_log.input';
import { UpdateAuthaAuditLogInput } from './dto/update-autha_audit_log.input';

@Resolver(() => AuthaAuditLog)
export class AuthaAuditLogsResolver {
  constructor(private readonly authaAuditLogsService: AuthaAuditLogsService) {}

  @Mutation(() => AuthaAuditLog)
  createAuthaAuditLog(@Args('createAuthaAuditLogInput') createAuthaAuditLogInput: CreateAuthaAuditLogInput) {
    return this.authaAuditLogsService.create(createAuthaAuditLogInput);
  }

  @Query(() => [AuthaAuditLog], { name: 'authaAuditLogs' })
  findAll() {
    return this.authaAuditLogsService.findAll();
  }

  @Query(() => AuthaAuditLog, { name: 'authaAuditLog' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.authaAuditLogsService.findOne(id);
  }

  @Mutation(() => AuthaAuditLog)
  updateAuthaAuditLog(@Args('updateAuthaAuditLogInput') updateAuthaAuditLogInput: UpdateAuthaAuditLogInput) {
    return this.authaAuditLogsService.update(updateAuthaAuditLogInput.id, updateAuthaAuditLogInput);
  }

  @Mutation(() => AuthaAuditLog)
  removeAuthaAuditLog(@Args('id', { type: () => Int }) id: number) {
    return this.authaAuditLogsService.remove(id);
  }
}
