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

import { AssignmentsService } from './assignments.service';
import { Assignment } from './entities/assignment.entity';
import { CreateAssignmentInput } from './dto/create-assignment.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { verifyAuthenticatedUser } from 'src/middleware/role-authorization.middleware';

@Resolver(() => Assignment)
export class AssignmentsResolver {
  constructor(
    private readonly assignmentsService: AssignmentsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Admin được tạo assignment cho mọi class.
   * Teacher chỉ được tạo assignment cho class mình đang dạy.
   */
  private async assertCanManageAssignmentClass(
    req: Request,
    classId: number,
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

    const classItem =
      await this.prisma.class.findUnique({
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
      throw new NotFoundException(
        'Class is not found',
      );
    }

    const role =
      validation.role.toLowerCase();

    if (role === 'admin') {
      return validation.userId;
    }

    if (role !== 'teacher') {
      throw new ForbiddenException(
        'Admin or teacher role is required',
      );
    }

    const isTeacherOfClass =
      classItem.teachers.length > 0;

    if (!isTeacherOfClass) {
      throw new ForbiddenException(
        'Teacher can only create assignments for classes they teach',
      );
    }

    return validation.userId;
  }

  private async assertCanViewAssignments(
    req: Request,
    targetUserId: number,
  ): Promise<void> {
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

    const isAdmin =
      validation.role.toLowerCase() === 'admin';

    const isOwnData =
      validation.userId === targetUserId;

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
    const currentUserId =
      await this.assertCanManageAssignmentClass(
        req,
        createAssignmentInput.classId,
      );

    return this.assignmentsService.create(
      createAssignmentInput,
      currentUserId,
    );
  }

  @Query(() => [Assignment], {
    name: 'assignmentsByUserAndClass',
  })
  async findByUserAndClass(
    @Args('userId', {
      type: () => Int,
    })
    userId: number,
    @Args('classId', {
      type: () => Int,
    })
    classId: number,
    @Context('req') req: Request,
  ) {
    await this.assertCanViewAssignments(
      req,
      userId,
    );

    return this.assignmentsService.findByUserAndClass(
      userId,
      classId,
    );
  }

  @Query(() => Assignment, {
    name: 'assignment',
  })
  async findOne(
    @Args('id', {
      type: () => Int,
    })
    id: number,
    @Context('req') req: Request,
  ) {
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

    return this.assignmentsService.findOne(
      id,
      validation.userId,
      validation.role,
    );
  }
}