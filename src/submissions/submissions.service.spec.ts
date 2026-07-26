import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { SubmissionsService } from './submissions.service';

describe('SubmissionsService', () => {
  let service: SubmissionsService;
  let prisma: {
    assignment: { findUnique: jest.Mock };
    submission: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let notificationsService: { createMany: jest.Mock };

  const publishedAssignment = {
    id: 1,
    title: 'Array Fundamentals',
    classId: 10,
    status: 'published',
    allowResubmit: true,
    deadline: new Date('2026-08-01T00:00:00.000Z'),
    class: {
      id: 10,
      students: [{ id: 5 }],
      teachers: [{ id: 2 }, { id: 3 }],
    },
  };

  beforeEach(async () => {
    prisma = {
      assignment: { findUnique: jest.fn() },
      submission: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
    };

    notificationsService = { createMany: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<SubmissionsService>(SubmissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitAssignment', () => {
    it('rejects an empty submission (no content, no files)', async () => {
      await expect(
        service.submitAssignment(
          { assignmentId: 1, content: '  ', attachFiles: [] },
          5,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when the assignment does not exist', async () => {
      prisma.assignment.findUnique.mockResolvedValue(null);

      await expect(
        service.submitAssignment({ assignmentId: 999, content: 'hi' }, 5),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects a student who is not enrolled in the class', async () => {
      prisma.assignment.findUnique.mockResolvedValue({
        ...publishedAssignment,
        class: { ...publishedAssignment.class, students: [] },
      });

      await expect(
        service.submitAssignment({ assignmentId: 1, content: 'hi' }, 5),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects submitting to a draft assignment', async () => {
      prisma.assignment.findUnique.mockResolvedValue({
        ...publishedAssignment,
        status: 'draft',
      });

      await expect(
        service.submitAssignment({ assignmentId: 1, content: 'hi' }, 5),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects a resubmission when allowResubmit is false and a submission already exists', async () => {
      prisma.assignment.findUnique.mockResolvedValue({
        ...publishedAssignment,
        allowResubmit: false,
      });
      prisma.submission.findUnique.mockResolvedValue({ id: 100 });

      await expect(
        service.submitAssignment({ assignmentId: 1, content: 'second try' }, 5),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows a first-ever submission even when allowResubmit is false', async () => {
      prisma.assignment.findUnique.mockResolvedValue({
        ...publishedAssignment,
        allowResubmit: false,
      });
      prisma.submission.findUnique.mockResolvedValue(null);
      prisma.submission.upsert.mockResolvedValue({
        id: 1,
        submittedAt: new Date('2026-07-20T00:00:00.000Z'),
        grade: null,
        student: { id: 5, name: 'Student 5' },
        assignment: publishedAssignment,
      });

      const result = await service.submitAssignment(
        { assignmentId: 1, content: 'first try' },
        5,
      );

      expect(result.status).toBe('submitted');
    });

    it('notifies exactly the class teachers on a successful submission', async () => {
      prisma.assignment.findUnique.mockResolvedValue(publishedAssignment);
      prisma.submission.findUnique.mockResolvedValue(null);
      prisma.submission.upsert.mockResolvedValue({
        id: 1,
        submittedAt: new Date('2026-07-20T00:00:00.000Z'),
        grade: null,
        student: { id: 5, name: 'Student 5' },
        assignment: publishedAssignment,
      });

      await service.submitAssignment({ assignmentId: 1, content: 'hello' }, 5);

      expect(notificationsService.createMany).toHaveBeenCalledWith(
        [2, 3],
        'submission_received',
        'Student 5 submitted Array Fundamentals',
        undefined,
        '/classes/10/assignments',
      );
    });

    it('derives a "late" status when submitted after the deadline', async () => {
      prisma.assignment.findUnique.mockResolvedValue(publishedAssignment);
      prisma.submission.findUnique.mockResolvedValue(null);
      prisma.submission.upsert.mockResolvedValue({
        id: 1,
        submittedAt: new Date('2026-09-01T00:00:00.000Z'),
        grade: null,
        student: { id: 5, name: 'Student 5' },
        assignment: publishedAssignment,
      });

      const result = await service.submitAssignment(
        { assignmentId: 1, content: 'late work' },
        5,
      );

      expect(result.status).toBe('late');
    });

    it('derives a "graded" status once a grade exists, regardless of timing', async () => {
      prisma.assignment.findUnique.mockResolvedValue(publishedAssignment);
      prisma.submission.findUnique.mockResolvedValue({ id: 1 });
      prisma.submission.upsert.mockResolvedValue({
        id: 1,
        submittedAt: new Date('2026-09-01T00:00:00.000Z'),
        grade: { score: 90 },
        student: { id: 5, name: 'Student 5' },
        assignment: publishedAssignment,
      });

      const result = await service.submitAssignment(
        { assignmentId: 1, content: 'graded work' },
        5,
      );

      expect(result.status).toBe('graded');
    });
  });

  describe('findByAssignment', () => {
    it('throws when the assignment does not exist', async () => {
      prisma.assignment.findUnique.mockResolvedValue(null);

      await expect(service.findByAssignment(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
