import { Test, TestingModule } from '@nestjs/testing';
import { AuthAuditLogsResolver } from './auth_audit_logs.resolver';
import { AuthAuditLogsService } from './auth_audit_logs.service';

describe('AuthAuditLogsResolver', () => {
  let resolver: AuthAuditLogsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthAuditLogsResolver, AuthAuditLogsService],
    }).compile();

    resolver = module.get<AuthAuditLogsResolver>(AuthAuditLogsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
