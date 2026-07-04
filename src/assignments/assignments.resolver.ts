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
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { AssignmentsService } from './assignments.service';
import { Assignment } from './entities/assignment.entity';
import { CreateAssignmentInput } from './dto/create-assignment.input';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  verifyAdminTeacherRole,
  verifyAuthenticatedUser,
} from 'src/middleware/role-authorization.middleware';

@Resolver(() => Assignment)
export class AssignmentsResolver {
  constructor(
    private readonly assignmentsService: AssignmentsService,
    private readonly prisma: PrismaService,
  ) {}

  private async assertAdminTeacher(req: Request): Promise<void> {
    const validation = await verifyAdminTeacherRole(req, this.prisma);

    if (validation.ok) {
      return;
    }

    if (validation.status === 'unauthorized') {
      throw new UnauthorizedException(validation.message);
    }

    throw new ForbiddenException(validation.message);
  }

  private async assertCanViewAssignments(
    req: Request,
    targetUserId: number,
  ): Promise<void> {
    const validation = await verifyAuthenticatedUser(req, this.prisma);

    if (!validation.ok) {
      throw new UnauthorizedException(validation.message);
    }

    const isAdmin = validation.role.toLowerCase() === 'admin';
    const isOwnData = validation.userId === targetUserId;

    if (!isAdmin && !isOwnData) {
      throw new ForbiddenException(
        'You do not have permission to view this user assignments',
      );
    }
  }

  @Mutation(() => Assignment)
  async createAssignment(
    @Args('createAssignmentInput')
    createAssignmentInput: CreateAssignmentInput,
    @Context('req') req: Request,
  ) {
    await this.assertAdminTeacher(req);

    return this.assignmentsService.create(createAssignmentInput);
  }

  @Query(() => [Assignment], {
    name: 'assignmentsByUserAndClass',
  })
  async findByUserAndClass(
    @Args('userId', { type: () => Int }) userId: number,
    @Args('classId', { type: () => Int }) classId: number,
    @Context('req') req: Request,
  ) {
    await this.assertCanViewAssignments(req, userId);

    return this.assignmentsService.findByUserAndClass(userId, classId);
  }

  @Query(() => Assignment, {
    name: 'assignment',
  })
@Query(() => Assignment, {
  name: 'assignment',
})
async findOne(
  @Args('id', { type: () => Int }) id: number,
  @Context('req') req: Request,
) {
  const validation = await verifyAuthenticatedUser(req, this.prisma);

  if (!validation.ok) {
    throw new UnauthorizedException(validation.message);
  }

  return this.assignmentsService.findOne(
    id,
    validation.userId,
    validation.role,
  );
}
}