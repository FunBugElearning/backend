import {
  Args,
  Context,
  Int,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';
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
   * Admin được thao tác mọi class.
   * Teacher chỉ được thao tác class mình đang dạy.
   */
  private async assertCanManageClass(
    req: Request,
    classId: number,
  ): Promise<void> {
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
      return;
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
  }

  /**
   * Admin xem mọi class.
   * Teacher/Student chỉ xem class mình thuộc về.
   */
  private async assertCanViewClass(
    req: Request,
    classId: number,
  ): Promise<void> {
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
        students: {
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
      return;
    }

    const belongsToClass =
      classItem.teachers.length > 0 || classItem.students.length > 0;

    if (!belongsToClass) {
      throw new ForbiddenException(
        'You must belong to this class to view grade categories',
      );
    }
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
    await this.assertCanManageClass(req, input.classId);

    return this.gradeCategoriesService.create(input);
  }

  /**
   * New requirement:
   * Get grade categories by classId.
   */
  @Query(() => [ClassGradeCategory], {
    name: 'gradeCategoriesByClass',
  })
  async getGradeCategoriesByClass(
    @Args('classId', {
      type: () => Int,
    })
    classId: number,
    @Context('req') req: Request,
  ) {
    await this.assertCanViewClass(req, classId);

    return this.gradeCategoriesService.findByClassId(classId);
  }
}