import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGradeCategoryInput } from './dto/create-grade-category.input';

@Injectable()
export class GradeCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateGradeCategoryInput) {
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

    const existingCategory =
      await this.prisma.classGradeCategory.findFirst({
        where: {
          classId: input.classId,
          name: {
            equals: input.name.trim(),
            mode: 'insensitive',
          },
        },
      });

    if (existingCategory) {
      throw new BadRequestException(
        'Grade category name already exists in this class',
      );
    }

    const existingCategories =
      await this.prisma.classGradeCategory.findMany({
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