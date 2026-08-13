import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdSequenceService } from '../prisma/id-sequence.service';
import { UsersService } from './users.service';

jest.mock('../utils/password.utils', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    role: { findUnique: jest.Mock; create: jest.Mock };
  };
  let idSequence: { next: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      role: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    idSequence = { next: jest.fn().mockResolvedValue(1) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: IdSequenceService, useValue: idSequence },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTeacher / createStudent', () => {
    it('createTeacher always resolves the teacher role, ignoring any client-supplied role_id', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.findUnique.mockResolvedValue(null);
      prisma.role.create.mockResolvedValue({ id: 2, name: 'teacher' });
      prisma.user.create.mockResolvedValue({
        id: 1,
        role: { id: 2, name: 'teacher' },
      });

      await service.createTeacher({
        name: 'New Teacher',
        email: 'teacher@example.com',
        password: 'password123',
        // A malicious/naive client trying to smuggle a different role_id.
        role_id: 1,
      } as never);

      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'teacher' },
      });
      const createCalls = prisma.user.create.mock.calls as [
        { data: { role: { connect: { id: number } } } },
      ][];
      const createArgs = createCalls[0][0];
      expect(createArgs.data.role).toEqual({ connect: { id: 2 } });
    });

    it('createStudent always resolves the student role, ignoring any client-supplied role_id', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.findUnique.mockResolvedValue(null);
      prisma.role.create.mockResolvedValue({ id: 3, name: 'student' });
      prisma.user.create.mockResolvedValue({
        id: 1,
        role: { id: 3, name: 'student' },
      });

      await service.createStudent({
        name: 'New Student',
        email: 'student@example.com',
        password: 'password123',
        role_id: 2, // attempting to smuggle the teacher role_id
      } as never);

      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'student' },
      });
      const createCalls = prisma.user.create.mock.calls as [
        { data: { role: { connect: { id: number } } } },
      ][];
      const createArgs = createCalls[0][0];
      expect(createArgs.data.role).toEqual({ connect: { id: 3 } });
    });

    it('rejects creating a teacher with an email that is already in use', async () => {
      prisma.role.findUnique.mockResolvedValue({ id: 2, name: 'teacher' });
      prisma.user.findUnique.mockResolvedValue({ id: 99 });

      await expect(
        service.createTeacher({
          name: 'Dup',
          email: 'dup@example.com',
          password: 'password123',
        } as never),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);

      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });
});
