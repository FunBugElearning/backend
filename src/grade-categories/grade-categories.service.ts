import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGradeCategoryInput } from './dto/create-grade-category.input';

@Injectable()
export class GradeCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async createGradeCategory(input: CreateGradeCategoryInput) {
    const name = input.name.trim();

    if (!name) {
      throw new BadRequestException('Category name is required');
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

    const existingCategory = await this.prisma.classGradeCategory.findFirst({
      where: {
        classId: input.classId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });

    if (existingCategory) {
      throw new ConflictException(
        'Grade category name already exists in this class',
      );
    }

    const totalWeightResult = await this.prisma.classGradeCategory.aggregate({
      where: {
        classId: input.classId,
      },
      _sum: {
        weight: true,
      },
    });

    const currentTotalWeight = totalWeightResult._sum.weight ?? 0;

    const newTotalWeight = currentTotalWeight + input.weight;

    if (newTotalWeight > 100) {
      throw new BadRequestException(
        `Total category weight cannot exceed 100. Current total is ${currentTotalWeight}`,
      );
    }

    return this.prisma.classGradeCategory.create({
      data: {
        classId: input.classId,
        name,
        weight: input.weight,
      },
      include: {
        class: true,
      },
    });
  }
}
