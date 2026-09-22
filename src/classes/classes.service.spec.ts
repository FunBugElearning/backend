import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { IdSequenceService } from 'src/prisma/id-sequence.service';
import { NotificationsService } from 'src/notifications/notifications.service';

describe('ClassesService', () => {
  let service: ClassesService;
  let prisma: {
    class: {
      findUnique: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
    user: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let notificationsService: { createMany: jest.Mock };
  let idSequence: { next: jest.Mock };

  beforeEach(async () => {
    prisma = {
      class: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      user: { findMany: jest.fn() },
      $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    };
    notificationsService = { createMany: jest.fn() };
    idSequence = { next: jest.fn().mockResolvedValue(1) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: IdSequenceService, useValue: idSequence },
      ],
    }).compile();

    service = module.get<ClassesService>(ClassesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addStudentsToClass', () => {
    it('rejects an empty student ID list', async () => {
      await expect(service.addStudentsToClass(1, [])).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects when the class does not exist', async () => {
      prisma.class.findUnique.mockResolvedValue(null);

      await expect(service.addStudentsToClass(999, [5])).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects a user who does not have the student role', async () => {
      prisma.class.findUnique.mockResolvedValue({
        id: 1,
        teachers: [],
        students: [],
      });
      prisma.user.findMany.mockResolvedValue([
        { id: 5, role: { name: 'teacher' } },
      ]);

      await expect(service.addStudentsToClass(1, [5])).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects a student who is already enrolled', async () => {
      prisma.class.findUnique.mockResolvedValue({
        id: 1,
        teachers: [],
        students: [{ id: 5 }],
      });
      prisma.user.findMany.mockResolvedValue([
        { id: 5, role: { name: 'student' } },
      ]);

      await expect(service.addStudentsToClass(1, [5])).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('enrolls valid students and notifies exactly the newly-added ones', async () => {
      prisma.class.findUnique.mockResolvedValue({
        id: 1,
        teachers: [],
        students: [],
      });
      prisma.user.findMany.mockResolvedValue([
        { id: 5, role: { name: 'student' } },
      ]);
      prisma.class.update.mockResolvedValue({
        id: 1,
        name: 'Math 101',
        teachers: [],
        students: [{ id: 5 }],
      });

      await service.addStudentsToClass(1, [5]);

      expect(notificationsService.createMany).toHaveBeenCalledWith(
        [5],
        'enrollment',
        'You have been enrolled in Math 101',
        undefined,
        '/classes/1',
      );
    });
  });

  describe('searchStudents', () => {
    it('rejects a search with neither name nor email', async () => {
      await expect(service.searchStudents({})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('with no filters, queries with an empty where clause', async () => {
      await service.findAll(1, 10);

      const [findManyArgs] = prisma.class.findMany.mock.calls[0] as [
        { where: unknown },
      ];
      const [countArgs] = prisma.class.count.mock.calls[0] as [
        { where: unknown },
      ];
      expect(findManyArgs.where).toEqual({});
      expect(countArgs.where).toEqual({});
    });

    it('BUG-004 regression: search is a real server-side where clause, not client-side filtering', async () => {
      await service.findAll(1, 10, 'Mentor');

      const [findManyArgs] = prisma.class.findMany.mock.calls[0] as [
        {
          where: {
            OR: Array<Record<string, { contains: string }>>;
          };
        },
      ];

      expect(findManyArgs.where.OR).toEqual([
        { name: { contains: 'Mentor' } },
        { nameLower: { contains: 'mentor' } },
      ]);
    });

    it('filters by teacherId', async () => {
      await service.findAll(1, 10, undefined, 42);

      const [findManyArgs] = prisma.class.findMany.mock.calls[0] as [
        { where: { teacherIds: { has: number } } },
      ];

      expect(findManyArgs.where.teacherIds).toEqual({ has: 42 });
    });

    it('computes totalPages from the count', async () => {
      prisma.class.count.mockResolvedValueOnce(25);

      const result = await service.findAll(1, 10);

      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3);
    });
  });
});
