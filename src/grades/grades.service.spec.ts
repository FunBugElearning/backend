import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { IdSequenceService } from 'src/prisma/id-sequence.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { GradesService } from './grades.service';

describe('GradesService', () => {
  let service: GradesService;
  let prisma: {
    submission: { findUnique: jest.Mock };
    grade: { upsert: jest.Mock };
  };
  let notificationsService: { create: jest.Mock };
  let idSequence: { next: jest.Mock };

  const submission = {
    id: 1,
    studentId: 5,
    classId: 10,
    student: { id: 5, name: 'Student 5' },
    assignment: {
      id: 1,
      classId: 10,
      title: 'Array Fundamentals',
      maxScore: 100,
    },
  };

  beforeEach(async () => {
    prisma = {
      submission: { findUnique: jest.fn() },
      grade: { upsert: jest.fn() },
    };

    notificationsService = { create: jest.fn() };
    idSequence = { next: jest.fn().mockResolvedValue(50) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradesService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: IdSequenceService, useValue: idSequence },
      ],
    }).compile();

    service = module.get<GradesService>(GradesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects when the submission does not exist', async () => {
    prisma.submission.findUnique.mockResolvedValue(null);

    await expect(
      service.gradeSubmission({ submissionId: 999, score: 90 }, 2),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a score above the assignment max score', async () => {
    prisma.submission.findUnique.mockResolvedValue(submission);

    await expect(
      service.gradeSubmission({ submissionId: 1, score: 150 }, 2),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.grade.upsert).not.toHaveBeenCalled();
  });

  it('accepts a valid score and notifies the submitting student', async () => {
    prisma.submission.findUnique.mockResolvedValue(submission);
    prisma.grade.upsert.mockResolvedValue({ id: 1, score: 90, feedback: null });

    const result = await service.gradeSubmission(
      { submissionId: 1, score: 90, feedback: '  Nice work  ' },
      2,
    );

    expect(result).toEqual({ id: 1, score: 90, feedback: null });
    const upsertCalls = prisma.grade.upsert.mock.calls as [
      {
        where: { submissionId: number };
        update: { score: number; feedback: string | null; gradedById: number };
        create: {
          id: number;
          submissionId: number;
          score: number;
          feedback: string | null;
          gradedById: number;
        };
      },
    ][];
    const upsertArgs = upsertCalls[0][0];
    expect(upsertArgs.where).toEqual({ submissionId: 1 });
    expect(upsertArgs.update).toEqual({
      score: 90,
      feedback: 'Nice work',
      gradedById: 2,
    });
    expect(upsertArgs.create).toEqual({
      id: 50,
      submissionId: 1,
      score: 90,
      feedback: 'Nice work',
      gradedById: 2,
    });
    expect(notificationsService.create).toHaveBeenCalledWith(
      5,
      'submission_graded',
      'Your submission for Array Fundamentals was graded',
      undefined,
      '/classes/10/assignments',
    );
  });
});
