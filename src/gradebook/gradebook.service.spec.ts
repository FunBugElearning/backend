import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GradebookService } from './gradebook.service';

describe('GradebookService', () => {
  let service: GradebookService;
  let prisma: { class: { findUnique: jest.Mock } };

  beforeEach(async () => {
    prisma = { class: { findUnique: jest.fn() } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradebookService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<GradebookService>(GradebookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getClassGradebook', () => {
    it("computes each student's final score as the weighted sum of category averages", async () => {
      prisma.class.findUnique.mockResolvedValue({
        id: 1,
        name: 'Math 101',
        students: [{ id: 5, name: 'Student 5', email: 's5@example.com' }],
        gradeCategories: [
          {
            id: 1,
            name: 'Homework',
            weight: 50,
            assignments: [
              {
                id: 1,
                maxScore: 100,
                submissions: [{ studentId: 5, grade: { score: 80 } }],
              },
            ],
          },
          {
            id: 2,
            name: 'Exams',
            weight: 50,
            assignments: [
              {
                id: 2,
                maxScore: 50,
                submissions: [{ studentId: 5, grade: { score: 25 } }],
              },
            ],
          },
        ],
      });

      const result = await service.getClassGradebook(1);

      // Homework: 80/100 = 80% * 50 weight = 40. Exams: 25/50 = 50% * 50 weight = 25.
      // Final score = 40 + 25 = 65.
      expect(result.students[0].finalScore).toBe(65);
    });

    it('treats an ungraded assignment as a 0 for that student, not a skipped average', async () => {
      prisma.class.findUnique.mockResolvedValue({
        id: 1,
        name: 'Math 101',
        students: [{ id: 5, name: 'Student 5', email: 's5@example.com' }],
        gradeCategories: [
          {
            id: 1,
            name: 'Homework',
            weight: 100,
            assignments: [{ id: 1, maxScore: 100, submissions: [] }],
          },
        ],
      });

      const result = await service.getClassGradebook(1);

      expect(result.students[0].finalScore).toBe(0);
    });

    it('throws when the class does not exist', async () => {
      prisma.class.findUnique.mockResolvedValue(null);

      await expect(service.getClassGradebook(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('getStudentOwnGrades', () => {
    it('rejects a student who does not belong to the class', async () => {
      prisma.class.findUnique.mockResolvedValue({
        id: 1,
        students: [],
        gradeCategories: [],
      });

      await expect(service.getStudentOwnGrades(1, 5)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });
});
