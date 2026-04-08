import { Test, TestingModule } from '@nestjs/testing';
import { AuthaAuditLogsService } from './auth_audit_logs.service';

describe('AuthaAuditLogsService', () => {
  let service: AuthaAuditLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthaAuditLogsService],
    }).compile();

    service = module.get<AuthaAuditLogsService>(AuthaAuditLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
