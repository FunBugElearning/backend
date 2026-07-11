import {
  Args,
  Context,
  Mutation,
  Resolver,
} from '@nestjs/graphql';
import {
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { SubmissionsService } from './submissions.service';
import { Submission } from './entities/submission.entity';
import { SubmitAssignmentInput } from './dto/submit-assignment.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { verifyAuthenticatedUser } from 'src/middleware/role-authorization.middleware';

@Resolver(() => Submission)
export class SubmissionsResolver {
  constructor(
    private readonly submissionsService: SubmissionsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Chỉ Student được submit assignment.
   */
  private async assertStudent(
    req: Request,
  ): Promise<number> {
    const validation =
      await verifyAuthenticatedUser(
        req,
        this.prisma,
      );

    if (!validation.ok) {
      throw new UnauthorizedException(
        validation.message,
      );
    }

    const role =
      validation.role.toLowerCase();

    if (role !== 'student') {
      throw new ForbiddenException(
        'Student role is required',
      );
    }

    return validation.userId;
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
    const studentId =
      await this.assertStudent(req);

    return this.submissionsService.submitAssignment(
      input,
      studentId,
    );
  }
}