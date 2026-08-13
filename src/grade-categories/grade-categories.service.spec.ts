import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { IdSequenceService } from 'src/prisma/id-sequence.service';
import { GradeCategoriesService } from './grade-categories.service';

describe('GradeCategoriesService', () => {
  let service: GradeCategoriesService;
  let prisma: {
    class: { findUnique: jest.Mock };
    classGradeCategory: {
      findMany: jest.Mock;
      create: jest.Mock;
    };
    $runCommandRaw: jest.Mock;
  };
  let idSequence: { next: jest.Mock };

  beforeEach(async () => {
    prisma = {
      class: { findUnique: jest.fn() },
      classGradeCategory: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      $runCommandRaw: jest.fn().mockResolvedValue({
        cursor: { firstBatch: [] },
      }),
    };
    idSequence = { next: jest.fn().mockResolvedValue(2) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradeCategoriesService,
        { provide: PrismaService, useValue: prisma },
        { provide: IdSequenceService, useValue: idSequence },
      ],
    }).compile();

    service = module.get<GradeCategoriesService>(GradeCategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects a blank category name', async () => {
    await expect(
      service.create({ classId: 1, name: '   ', weight: 20 }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.class.findUnique).not.toHaveBeenCalled();
  });

  it('rejects when the class does not exist', async () => {
    prisma.class.findUnique.mockResolvedValue(null);

    await expect(
      service.create({
        classId: 999,
        name: 'Homework',
        weight: 20,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a duplicate category name in the same class (case-insensitive)', async () => {
    prisma.class.findUnique.mockResolvedValue({ id: 1 });
    prisma.$runCommandRaw.mockResolvedValue({
      cursor: { firstBatch: [{ _id: 1 }] },
    });

    await expect(
      service.create({ classId: 1, name: 'HOMEWORK', weight: 20 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when the new category would push total weight over 100', async () => {
    prisma.class.findUnique.mockResolvedValue({ id: 1 });
    prisma.classGradeCategory.findMany.mockResolvedValue([{ weight: 90 }]);

    await expect(
      service.create({ classId: 1, name: 'Exams', weight: 20 }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.classGradeCategory.create).not.toHaveBeenCalled();
  });

  it('creates the category when the running total weight stays at or under 100', async () => {
    prisma.class.findUnique.mockResolvedValue({ id: 1 });
    prisma.classGradeCategory.findMany.mockResolvedValue([{ weight: 80 }]);
    prisma.classGradeCategory.create.mockResolvedValue({
      id: 2,
      name: 'Exams',
      weight: 20,
    });

    await expect(
      service.create({
        classId: 1,
        name: '  Exams  ',
        weight: 20,
      }),
    ).resolves.toEqual({ id: 2, name: 'Exams', weight: 20 });

    expect(prisma.classGradeCategory.create).toHaveBeenCalledWith({
      data: { id: 2, classId: 1, name: 'Exams', weight: 20 },
      include: { class: true },
    });
  });
});
