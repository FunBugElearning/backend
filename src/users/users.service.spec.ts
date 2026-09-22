import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
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
      count: jest.Mock;
    };
    role: { findUnique: jest.Mock; create: jest.Mock };
    attendanceSession: { count: jest.Mock };
    grade: { count: jest.Mock };
    $transaction: jest.Mock;
  };
  let idSequence: { next: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      role: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      attendanceSession: { count: jest.fn().mockResolvedValue(0) },
      grade: { count: jest.fn().mockResolvedValue(0) },
      $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
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

  describe('update', () => {
    it('rejects a nonexistent user id', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.update(999, { id: 999, name: 'Ghost' } as never),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects changing email to one already used by another user', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 1, email: 'me@example.com' }) // existingUser lookup
        .mockResolvedValueOnce({ id: 2, email: 'taken@example.com' }); // emailOwner lookup

      await expect(
        service.update(1, {
          id: 1,
          email: 'taken@example.com',
        } as never),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('allows keeping your own current email unchanged', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 1,
        email: 'me@example.com',
      });
      prisma.user.update.mockResolvedValue({ id: 1, email: 'me@example.com' });

      await service.update(1, {
        id: 1,
        email: 'me@example.com',
        name: 'Updated Name',
      } as never);

      // Only the existingUser lookup should have run - no separate
      // emailOwner lookup since the email didn't actually change.
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('rejects a nonexistent user id', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('blocks deleting a user who created attendance sessions or grades', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 });
      prisma.attendanceSession.count.mockResolvedValue(3);
      prisma.grade.count.mockResolvedValue(0);

      await expect(service.remove(1)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );

      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('clears class memberships then deletes a user with no blocking activity', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 });
      prisma.attendanceSession.count.mockResolvedValue(0);
      prisma.grade.count.mockResolvedValue(0);
      prisma.user.update.mockResolvedValue({ id: 1 });
      prisma.user.delete.mockResolvedValue({ id: 1 });

      await service.remove(1);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          classesAsTeacher: { set: [] },
          classesAsStudent: { set: [] },
        },
      });
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('findAllPaginated', () => {
    it('BUG-002/003/004 regression: filters by role and search as a real server-side where clause with pagination', async () => {
      await service.findAllPaginated({
        page: 2,
        limit: 5,
        search: 'Ada',
        roleName: 'student',
      });

      const [findManyArgs] = prisma.user.findMany.mock.calls[0] as [
        {
          where: { AND: unknown[] };
          skip: number;
          take: number;
        },
      ];

      expect(findManyArgs.skip).toBe(5); // (page 2 - 1) * limit 5
      expect(findManyArgs.take).toBe(5);
      expect(findManyArgs.where.AND).toContainEqual({
        role: { is: { name: 'student' } },
      });
      expect(findManyArgs.where.AND).toContainEqual({
        OR: [
          { nameLower: { contains: 'ada' } },
          { emailLower: { contains: 'ada' } },
        ],
      });
    });

    it('filters students by class membership using classesAsStudentIds', async () => {
      await service.findAllPaginated({ roleName: 'student', classId: 7 });

      const [findManyArgs] = prisma.user.findMany.mock.calls[0] as [
        { where: { AND: unknown[] } },
      ];

      expect(findManyArgs.where.AND).toContainEqual({
        classesAsStudentIds: { has: 7 },
      });
    });

    it('filters teachers by class assignment using classesAsTeacherIds', async () => {
      await service.findAllPaginated({ roleName: 'teacher', classId: 7 });

      const [findManyArgs] = prisma.user.findMany.mock.calls[0] as [
        { where: { AND: unknown[] } },
      ];

      expect(findManyArgs.where.AND).toContainEqual({
        classesAsTeacherIds: { has: 7 },
      });
    });
  });
});
