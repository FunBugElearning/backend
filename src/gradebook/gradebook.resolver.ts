import { Args, Context, Int, Query, Resolver } from '@nestjs/graphql';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { GradebookService } from './gradebook.service';
import { ClassGradebook } from './entities/class-gradebook.entity';
import { StudentGradebook } from './entities/student-gradebook.entity';
import { PrismaService } from 'src/prisma/prisma.service';
import { verifyAuthenticatedUser } from 'src/middleware/role-authorization.middleware';

@Resolver(() => ClassGradebook)
export class GradebookResolver {
  constructor(
    private readonly gradebookService: GradebookService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Admin xem gradebook mọi class.
   * Teacher chỉ xem gradebook class mình đang dạy.
   */
  private async assertCanViewClassGradebook(
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
        'Teacher can only view gradebook for classes they teach',
      );
    }
  }

  /**
   * Chỉ Student được xem điểm của chính mình.
   */
  private async assertStudent(req: Request): Promise<number> {
    const validation = await verifyAuthenticatedUser(req, this.prisma);

    if (!validation.ok) {
      throw new UnauthorizedException(validation.message);
    }

    const role = validation.role.toLowerCase();

    if (role !== 'student') {
      throw new ForbiddenException('Student role is required');
    }

    return validation.userId;
  }

  /**
   * Task 13:
   * Class gradebook final score by category weights.
   */
  @Query(() => ClassGradebook, {
    name: 'classGradebook',
  })
  async getClassGradebook(
    @Args('classId', {
      type: () => Int,
    })
    classId: number,
    @Context('req') req: Request,
  ) {
    await this.assertCanViewClassGradebook(req, classId);

    return this.gradebookService.getClassGradebook(classId);
  }

  /**
   * Task 14:
   * Student view own grades.
   */
  @Query(() => StudentGradebook, {
    name: 'myGrades',
  })
  async getMyGrades(
    @Args('classId', {
      type: () => Int,
    })
    classId: number,
    @Context('req') req: Request,
  ) {
    const studentId = await this.assertStudent(req);

    return this.gradebookService.getStudentOwnGrades(classId, studentId);
  }
}
