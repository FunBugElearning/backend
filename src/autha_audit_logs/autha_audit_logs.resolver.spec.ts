import { Test, TestingModule } from '@nestjs/testing';
import { AuthaAuditLogsResolver } from './autha_audit_logs.resolver';
import { AuthaAuditLogsService } from './autha_audit_logs.service';

describe('AuthaAuditLogsResolver', () => {
  let resolver: AuthaAuditLogsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthaAuditLogsResolver, AuthaAuditLogsService],
    }).compile();

    resolver = module.get<AuthaAuditLogsResolver>(AuthaAuditLogsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
