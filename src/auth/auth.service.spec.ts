import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { IdSequenceService } from '../prisma/id-sequence.service';
import { AuthService } from './auth.service';
import type { RegisterAuthInput } from './dto/register-auth.input';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock };
    authSession: { create: jest.Mock };
    role: { findUnique: jest.Mock; create: jest.Mock };
  };
  let idSequence: { next: jest.Mock };
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = {
      ...originalEnv,
      ACCESS_TOKEN_SECRET: 'test-access-secret',
      REFRESH_TOKEN_SECRET: 'test-refresh-secret',
    };

    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      authSession: {
        create: jest.fn(),
      },
      role: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    idSequence = { next: jest.fn().mockResolvedValue(1) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: IdSequenceService,
          useValue: idSequence,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('never grants a client-requested role — always resolves to student, even when role="admin" is sent', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.findUnique.mockResolvedValue(null);
      prisma.role.create.mockResolvedValue({ id: 1, name: 'student' });
      prisma.user.create.mockResolvedValue({
        id: 1,
        name: 'Eve',
        email: 'eve@example.com',
        role: { id: 1, name: 'student' },
      });
      prisma.authSession.create.mockResolvedValue({});

      const attackerInput = {
        name: 'Eve',
        email: 'eve@example.com',
        password: 'password123',
        dateOfBirth: new Date('2000-01-01'),
        role: 'admin',
      } as RegisterAuthInput;

      const result = await service.register(attackerInput, {
        browser_agent: 'jest',
        ip_address: '127.0.0.1',
      });

      expect(result.success).toBe(true);
      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'student' },
      });
      expect(prisma.role.findUnique).not.toHaveBeenCalledWith({
        where: { name: 'admin' },
      });
    });
  });
});
