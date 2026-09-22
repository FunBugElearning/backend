import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { IdSequenceService } from 'src/prisma/id-sequence.service';
import { NotificationsService } from 'src/notifications/notifications.service';

describe('QuizzesService', () => {
  let service: QuizzesService;
  let prisma: {
    assignment: { findUnique: jest.Mock };
    quiz: { findUnique: jest.Mock; create: jest.Mock };
    submission: { findUnique: jest.Mock; create: jest.Mock };
    quizAttempt: {
      create: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      count: jest.Mock;
    };
    grade: { create: jest.Mock };
    $transaction: jest.Mock;
  };
  let notificationsService: { create: jest.Mock; createMany: jest.Mock };
  let idSequence: { next: jest.Mock };

  beforeEach(async () => {
    prisma = {
      assignment: { findUnique: jest.fn() },
      quiz: { findUnique: jest.fn(), create: jest.fn() },
      submission: { findUnique: jest.fn(), create: jest.fn() },
      quizAttempt: {
        create: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      grade: { create: jest.fn() },
      $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    };
    notificationsService = {
      create: jest.fn().mockResolvedValue(undefined),
      createMany: jest.fn().mockResolvedValue(undefined),
    };
    let counter = 0;
    idSequence = { next: jest.fn(() => Promise.resolve(++counter)) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizzesService,
        { provide: PrismaService, useValue: prisma },
        { provide: IdSequenceService, useValue: idSequence },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<QuizzesService>(QuizzesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('rejects a question with zero or more than one correct option', async () => {
      prisma.assignment.findUnique.mockResolvedValue({
        id: 1,
        type: 'quiz',
      });
      prisma.quiz.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          {
            assignmentId: 1,
            questions: [
              {
                prompt: 'Q1',
                options: [
                  { text: 'A', isCorrect: true },
                  { text: 'B', isCorrect: true },
                ],
              },
            ],
          } as never,
          1,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects creating a quiz for a non-quiz-type assignment', async () => {
      prisma.assignment.findUnique.mockResolvedValue({
        id: 1,
        type: 'standard',
      });

      await expect(
        service.create(
          {
            assignmentId: 1,
            questions: [
              {
                prompt: 'Q1',
                options: [
                  { text: 'A', isCorrect: true },
                  { text: 'B', isCorrect: false },
                ],
              },
            ],
          } as never,
          1,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('submitAttempt (auto-grading)', () => {
    function baseAssignment(overrides: Record<string, unknown> = {}) {
      return {
        id: 10,
        title: 'Quiz A',
        classId: 3,
        status: 'published',
        type: 'quiz',
        createdById: 99,
        class: {
          id: 3,
          students: [{ id: 5 }],
          teachers: [{ id: 99 }],
        },
        quiz: {
          id: 1,
          createdById: 99,
          questions: [
            {
              id: 101,
              points: 2,
              options: [
                { id: 1001, isCorrect: true },
                { id: 1002, isCorrect: false },
              ],
            },
            {
              id: 102,
              points: 3,
              options: [
                { id: 1003, isCorrect: false },
                { id: 1004, isCorrect: true },
              ],
            },
          ],
        },
        ...overrides,
      };
    }

    beforeEach(() => {
      prisma.submission.findUnique.mockResolvedValue(null);
      prisma.submission.create.mockResolvedValue({
        id: 500,
        student: { name: 'Student 5' },
      });
      prisma.quizAttempt.create.mockResolvedValue({ id: 700 });
      prisma.grade.create.mockResolvedValue({ id: 900 });
      prisma.quizAttempt.findUniqueOrThrow.mockResolvedValue({
        id: 700,
        score: 5,
        maxScore: 5,
      });
    });

    it('computes the score correctly from correct/incorrect answers', async () => {
      prisma.assignment.findUnique.mockResolvedValue(baseAssignment());

      await service.submitAttempt(
        {
          assignmentId: 10,
          answers: [
            { questionId: 101, optionId: 1001 }, // correct, +2
            { questionId: 102, optionId: 1003 }, // wrong, +0
          ],
        },
        5,
      );

      const gradeCreateCalls = prisma.grade.create.mock.calls as [
        { data: { score: number; gradedById: number } },
      ][];
      expect(gradeCreateCalls[0][0].data.score).toBe(2);
      expect(gradeCreateCalls[0][0].data.gradedById).toBe(99);

      const attemptCreateCalls = prisma.quizAttempt.create.mock.calls as [
        { data: { score: number; maxScore: number } },
      ][];
      expect(attemptCreateCalls[0][0].data.score).toBe(2);
      expect(attemptCreateCalls[0][0].data.maxScore).toBe(5);
    });

    it('scores an unanswered question as 0 without erroring', async () => {
      prisma.assignment.findUnique.mockResolvedValue(baseAssignment());

      await service.submitAttempt(
        {
          assignmentId: 10,
          answers: [{ questionId: 101, optionId: 1001 }], // question 102 left unanswered
        },
        5,
      );

      const attemptCreateCalls = prisma.quizAttempt.create.mock.calls as [
        { data: { score: number; maxScore: number } },
      ][];
      expect(attemptCreateCalls[0][0].data.score).toBe(2);
      expect(attemptCreateCalls[0][0].data.maxScore).toBe(5);
    });

    it('rejects a second attempt (single-attempt only)', async () => {
      prisma.assignment.findUnique.mockResolvedValue(baseAssignment());
      prisma.submission.findUnique.mockResolvedValue({ id: 1 });

      await expect(
        service.submitAttempt(
          { assignmentId: 10, answers: [{ questionId: 101, optionId: 1001 }] },
          5,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(prisma.submission.create).not.toHaveBeenCalled();
    });

    it('rejects a student who does not belong to the class', async () => {
      prisma.assignment.findUnique.mockResolvedValue(
        baseAssignment({ class: { id: 3, students: [], teachers: [] } }),
      );

      await expect(
        service.submitAttempt(
          { assignmentId: 10, answers: [{ questionId: 101, optionId: 1001 }] },
          5,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects submitting an unpublished (draft) quiz assignment', async () => {
      prisma.assignment.findUnique.mockResolvedValue(
        baseAssignment({ status: 'draft' }),
      );

      await expect(
        service.submitAttempt(
          { assignmentId: 10, answers: [{ questionId: 101, optionId: 1001 }] },
          5,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects an option id that does not belong to the referenced question', async () => {
      prisma.assignment.findUnique.mockResolvedValue(baseAssignment());

      await expect(
        service.submitAttempt(
          {
            assignmentId: 10,
            // 1003 belongs to question 102, not 101 - tampering attempt.
            answers: [{ questionId: 101, optionId: 1003 }],
          },
          5,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
