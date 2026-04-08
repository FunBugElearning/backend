import { Module } from '@nestjs/common';
import { AuthaAuditLogsService } from './autha_audit_logs.service';
import { AuthaAuditLogsResolver } from './autha_audit_logs.resolver';

@Module({
  providers: [AuthaAuditLogsResolver, AuthaAuditLogsService],
})
export class AuthaAuditLogsModule {}
