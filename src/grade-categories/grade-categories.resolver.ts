import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { GradeCategoriesService } from './grade-categories.service';
import { ClassGradeCategory } from './entities/class-grade-category.entity';
import { CreateGradeCategoryInput } from './dto/create-grade-category.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { verifyAuthenticatedUser } from 'src/middleware/role-authorization.middleware';

@Resolver(() => ClassGradeCategory)
export class GradeCategoriesResolver {
  constructor(
    private readonly gradeCategoriesService: GradeCategoriesService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Admin được tạo category cho mọi class.
   * Teacher chỉ được tạo category cho class mình đang dạy.
   */
  private async assertCanManageGradeCategoryClass(
    req: Request,
    classId: number,
  ): Promise<number> {
    const validation = await verifyAuthenticatedUser(req, this.prisma);

    if (!validation.ok) {
      throw new UnauthorizedException(validation.message);
    }

    const classItem = await this.prisma.class.findUnique({
      where: {
        id: classId,
      },
      select: {
        id: true,
        teachers: {
          where: {
            id: validation.userId,
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!classItem) {
      throw new NotFoundException('Class is not found');
    }

    const role = validation.role.toLowerCase();

    if (role === 'admin') {
      return validation.userId;
    }

    if (role !== 'teacher') {
      throw new ForbiddenException('Admin or teacher role is required');
    }

    const isTeacherOfClass = classItem.teachers.length > 0;

    if (!isTeacherOfClass) {
      throw new ForbiddenException(
        'Teacher can only manage grade categories for classes they teach',
      );
    }

    return validation.userId;
  }

  /**
   * Task 8:
   * Create grade category for class.
   */
  @Mutation(() => ClassGradeCategory)
  async createGradeCategory(
    @Args('input')
    input: CreateGradeCategoryInput,
    @Context('req') req: Request,
  ) {
    await this.assertCanManageGradeCategoryClass(req, input.classId);

    return this.gradeCategoriesService.createGradeCategory(input);
  }
}
