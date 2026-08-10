import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthAuditLogsService } from './auth_audit_logs.service';
import { AuthAuditLogsResolver } from './auth_audit_logs.resolver';

@Module({
  imports: [PrismaModule],
  providers: [AuthAuditLogsResolver, AuthAuditLogsService],
})
export class AuthAuditLogsModule {}
