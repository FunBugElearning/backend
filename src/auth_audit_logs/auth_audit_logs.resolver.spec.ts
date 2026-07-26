import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AuthAuditLogsResolver } from './auth_audit_logs.resolver';
import { AuthAuditLogsService } from './auth_audit_logs.service';

describe('AuthAuditLogsResolver', () => {
  let resolver: AuthAuditLogsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthAuditLogsResolver,
        AuthAuditLogsService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    resolver = module.get<AuthAuditLogsResolver>(AuthAuditLogsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
