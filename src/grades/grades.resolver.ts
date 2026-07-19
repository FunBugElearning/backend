import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { GradesService } from './grades.service';
import { Grade } from './entities/grade.entity';
import { GradeSubmissionInput } from './dto/grade-submission.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { verifyAuthenticatedUser } from 'src/middleware/role-authorization.middleware';

@Resolver(() => Grade)
export class GradesResolver {
  constructor(
    private readonly gradesService: GradesService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Admin được grade mọi submission.
   * Teacher chỉ được grade submission của class mình đang dạy.
   */
  private async assertCanGradeSubmission(
    req: Request,
    submissionId: number,
  ): Promise<number> {
    const validation = await verifyAuthenticatedUser(req, this.prisma);

    if (!validation.ok) {
      throw new UnauthorizedException(validation.message);
    }

    const submission = await this.prisma.submission.findUnique({
      where: {
        id: submissionId,
      },
      select: {
        id: true,
        assignment: {
          select: {
            class: {
              select: {
                teachers: {
                  where: {
                    id: validation.userId,
                  },
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission is not found');
    }

    const role = validation.role.toLowerCase();

    if (role === 'admin') {
      return validation.userId;
    }

    if (role !== 'teacher') {
      throw new ForbiddenException('Admin or teacher role is required');
    }

    const isTeacherOfClass = submission.assignment.class.teachers.length > 0;

    if (!isTeacherOfClass) {
      throw new ForbiddenException(
        'Teacher can only grade submissions for classes they teach',
      );
    }

    return validation.userId;
  }

  /**
   * Task 12:
   * Teacher/Admin grade submission.
   * If grade already exists, update it.
   */
  @Mutation(() => Grade)
  async gradeSubmission(
    @Args('input')
    input: GradeSubmissionInput,
    @Context('req') req: Request,
  ) {
    const gradedById = await this.assertCanGradeSubmission(
      req,
      input.submissionId,
    );

    return this.gradesService.gradeSubmission(input, gradedById);
  }
}
