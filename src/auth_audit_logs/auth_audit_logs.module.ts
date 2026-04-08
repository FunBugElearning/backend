import { Module } from '@nestjs/common';
import { AuthaAuditLogsService } from './auth_audit_logs.service';
import { AuthaAuditLogsResolver } from './auth_audit_logs.resolver';

@Module({
  providers: [AuthaAuditLogsResolver, AuthaAuditLogsService],
})
export class AuthaAuditLogsModule {}
