import { Module } from '@nestjs/common';
import { AuthAuditLogsService } from './auth_audit_logs.service';
import { AuthAuditLogsResolver } from './auth_audit_logs.resolver';

@Module({
  providers: [AuthAuditLogsResolver, AuthAuditLogsService],
})
export class AuthAuditLogsModule {}
