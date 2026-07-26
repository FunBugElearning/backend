import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AuthSessionsResolver } from './auth_sessions.resolver';
import { AuthSessionsService } from './auth_sessions.service';

describe('AuthSessionsResolver', () => {
  let resolver: AuthSessionsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthSessionsResolver,
        AuthSessionsService,
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

    resolver = module.get<AuthSessionsResolver>(AuthSessionsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
