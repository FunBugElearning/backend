import { Args, Context, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { SubmissionsService } from './submissions.service';
import { Submission } from './entities/submission.entity';
import { SubmitAssignmentInput } from './dto/submit-assignment.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { verifyAuthenticatedUser } from '../middleware/role-authorization.middleware';

@Resolver(() => Submission)
export class SubmissionsResolver {
  constructor(
    private readonly submissionsService: SubmissionsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Chỉ Student được submit assignment.
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
   * Admin sees any assignment's submissions; teacher only their own class's.
   */
  private async assertCanViewSubmissions(
    req: Request,
    assignmentId: number,
  ): Promise<void> {
    const validation = await verifyAuthenticatedUser(req, this.prisma);

    if (!validation.ok) {
      throw new UnauthorizedException(validation.message);
    }

    const assignment = await this.prisma.assignment.findUnique({
      where: {
        id: assignmentId,
      },
      select: {
        id: true,
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
    });

    if (!assignment) {
      throw new NotFoundException('Assignment is not found');
    }

    const role = validation.role.toLowerCase();

    if (role === 'admin') {
      return;
    }

    if (role !== 'teacher') {
      throw new ForbiddenException('Admin or teacher role is required');
    }

    const isTeacherOfClass = assignment.class.teachers.length > 0;

    if (!isTeacherOfClass) {
      throw new ForbiddenException(
        'Teacher can only view submissions for classes they teach',
      );
    }
  }

  /**
   * Task 11:
   * Student submit assignment.
   * If submitted before, update old submission.
   */
  @Mutation(() => Submission)
  async submitAssignment(
    @Args('input')
    input: SubmitAssignmentInput,
    @Context('req') req: Request,
  ) {
    const studentId = await this.assertStudent(req);

    return this.submissionsService.submitAssignment(input, studentId);
  }

  /**
   * Teacher/admin: list every submission for one assignment, to grade.
   */
  @Query(() => [Submission], { name: 'submissionsByAssignment' })
  async findByAssignment(
    @Args('assignmentId', { type: () => Int }) assignmentId: number,
    @Context('req') req: Request,
  ) {
    await this.assertCanViewSubmissions(req, assignmentId);

    return this.submissionsService.findByAssignment(assignmentId);
  }

  /**
   * The calling student's own submission for an assignment (or null if they
   * haven't submitted yet). studentId always comes from the verified token.
   */
  @Query(() => Submission, { name: 'mySubmission', nullable: true })
  async findMyByAssignment(
    @Args('assignmentId', { type: () => Int }) assignmentId: number,
    @Context('req') req: Request,
  ) {
    const validation = await verifyAuthenticatedUser(req, this.prisma);

    if (!validation.ok) {
      throw new UnauthorizedException(validation.message);
    }

    return this.submissionsService.findMyByAssignment(
      assignmentId,
      validation.userId,
    );
  }
}
