import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { IdSequenceService } from 'src/prisma/id-sequence.service';
import { CreateGradeCategoryInput } from './dto/create-grade-category.input';
import { escapeRegExp, firstBatchOf } from '../utils/mongo-search.utils';

interface ClassGradeCategoryDuplicateMatch {
  _id: number;
}

@Injectable()
export class GradeCategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idSequence: IdSequenceService,
  ) {}

  async create(input: CreateGradeCategoryInput) {
    if (!input.name.trim()) {
      throw new BadRequestException('Grade category name is required');
    }

    const classItem = await this.prisma.class.findUnique({
      where: {
        id: input.classId,
      },
      select: {
        id: true,
      },
    });

    if (!classItem) {
      throw new NotFoundException('Class is not found');
    }

    // Prisma's MongoDB connector doesn't support `mode: 'insensitive'`, so
    // this case-insensitive exact-match check goes through a raw command.
    const escapedName = escapeRegExp(input.name.trim());

    const rawMatches = await this.prisma.$runCommandRaw({
      find: 'class_grade_categories',
      filter: {
        classId: input.classId,
        name: { $regex: `^${escapedName}$`, $options: 'i' },
      },
      limit: 1,
    });

    const existingCategory =
      firstBatchOf<ClassGradeCategoryDuplicateMatch>(rawMatches).length > 0;

    if (existingCategory) {
      throw new BadRequestException(
        'Grade category name already exists in this class',
      );
    }

    const existingCategories = await this.prisma.classGradeCategory.findMany({
      where: {
        classId: input.classId,
      },
      select: {
        weight: true,
      },
    });

    const currentTotalWeight = existingCategories.reduce(
      (sum, category) => sum + category.weight,
      0,
    );

    const nextTotalWeight = currentTotalWeight + input.weight;

    if (nextTotalWeight > 100) {
      throw new BadRequestException(
        'Total grade category weight cannot exceed 100',
      );
    }

    return this.prisma.classGradeCategory.create({
      data: {
        id: await this.idSequence.next('ClassGradeCategory'),
        classId: input.classId,
        name: input.name.trim(),
        weight: input.weight,
      },
      include: {
        class: true,
      },
    });
  }

  async findByClassId(classId: number) {
    const classItem = await this.prisma.class.findUnique({
      where: {
        id: classId,
      },
      select: {
        id: true,
      },
    });

    if (!classItem) {
      throw new NotFoundException('Class is not found');
    }

    return this.prisma.classGradeCategory.findMany({
      where: {
        classId,
      },
      orderBy: {
        id: 'asc',
      },
      include: {
        class: true,
      },
    });
  }
}
