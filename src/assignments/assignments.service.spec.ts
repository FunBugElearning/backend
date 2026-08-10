import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';

describe('AssignmentsService', () => {
  let service: AssignmentsService;
  let prisma: {
    class: { findUnique: jest.Mock };
    classGradeCategory: { findUnique: jest.Mock };
    assignment: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
  };
  let notificationsService: { createMany: jest.Mock };

  const baseInput = {
    title: 'Array Fundamentals',
    classId: 10,
    deadline: '2026-08-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    prisma = {
      class: { findUnique: jest.fn() },
      classGradeCategory: { findUnique: jest.fn() },
      assignment: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    notificationsService = { createMany: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<AssignmentsService>(AssignmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('rejects a blank title without touching the database', async () => {
      await expect(
        service.create({ ...baseInput, title: '   ' }, 1),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.class.findUnique).not.toHaveBeenCalled();
    });

    it('rejects when the class does not exist', async () => {
      prisma.class.findUnique.mockResolvedValue(null);

      await expect(service.create(baseInput, 1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('defaults to draft and does not notify anyone', async () => {
      prisma.class.findUnique.mockResolvedValue({ id: 10 });
      prisma.assignment.create.mockResolvedValue({
        id: 1,
        classId: 10,
        title: 'Array Fundamentals',
        status: 'draft',
      });

      const result = await service.create(baseInput, 1);

      expect(result.status).toBe('draft');
      const createCalls = prisma.assignment.create.mock.calls as [
        { data: { status: string } },
      ][];
      expect(createCalls[0][0].data.status).toBe('draft');
      expect(notificationsService.createMany).not.toHaveBeenCalled();
    });

    it('notifies every enrolled student immediately when created already published', async () => {
      prisma.class.findUnique.mockResolvedValue({
        id: 10,
        students: [{ id: 5 }, { id: 6 }],
      });
      prisma.assignment.create.mockResolvedValue({
        id: 1,
        classId: 10,
        title: 'Array Fundamentals',
        status: 'published',
      });

      await service.create({ ...baseInput, status: 'published' }, 1);

      expect(notificationsService.createMany).toHaveBeenCalledWith(
        [5, 6],
        'assignment_published',
        'New assignment: Array Fundamentals',
        undefined,
        '/classes/10/assignments',
      );
    });
  });

  describe('publish', () => {
    it('throws when the assignment does not exist', async () => {
      prisma.assignment.findUnique.mockResolvedValue(null);

      await expect(service.publish(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('flips status to published and notifies the class', async () => {
      prisma.assignment.findUnique.mockResolvedValue({ id: 1 });
      prisma.assignment.update.mockResolvedValue({
        id: 1,
        classId: 10,
        title: 'Array Fundamentals',
        status: 'published',
      });
      prisma.class.findUnique.mockResolvedValue({
        id: 10,
        students: [{ id: 5 }],
      });

      await service.publish(1);

      expect(prisma.assignment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { status: 'published' },
        }),
      );
      expect(notificationsService.createMany).toHaveBeenCalledWith(
        [5],
        'assignment_published',
        'New assignment: Array Fundamentals',
        undefined,
        '/classes/10/assignments',
      );
    });
  });

  describe('update', () => {
    it('notifies once when status transitions draft -> published', async () => {
      prisma.assignment.findUnique.mockResolvedValue({
        id: 1,
        classId: 10,
        status: 'draft',
      });
      prisma.assignment.update.mockResolvedValue({
        id: 1,
        classId: 10,
        title: 'Array Fundamentals',
        status: 'published',
      });
      prisma.class.findUnique.mockResolvedValue({
        id: 10,
        students: [{ id: 5 }],
      });

      await service.update({ id: 1, status: 'published' });

      expect(notificationsService.createMany).toHaveBeenCalledTimes(1);
    });

    it('does not re-notify when the assignment is already published', async () => {
      prisma.assignment.findUnique.mockResolvedValue({
        id: 1,
        classId: 10,
        status: 'published',
      });
      prisma.assignment.update.mockResolvedValue({
        id: 1,
        classId: 10,
        title: 'Array Fundamentals',
        status: 'published',
      });

      await service.update({ id: 1, status: 'published' });

      expect(notificationsService.createMany).not.toHaveBeenCalled();
    });
  });
});
