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
import { UpdateAssignmentInput } from './dto/update-assignment.input';

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

    /**
   * Admin được update/delete mọi assignment.
   * Teacher chỉ update/delete assignment của class mình đang dạy.
   */
  private async assertCanManageAssignment(
    req: Request,
    assignmentId: number,
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

    const assignment =
      await this.prisma.assignment.findUnique({
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
      throw new NotFoundException(
        'Assignment is not found',
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
      assignment.class.teachers.length > 0;

    if (!isTeacherOfClass) {
      throw new ForbiddenException(
        'Teacher can only manage assignments for classes they teach',
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
    /**
   * Task 10:
   * Update assignment.
   */
  @Mutation(() => Assignment)
  async updateAssignment(
    @Args('input')
    input: UpdateAssignmentInput,
    @Context('req') req: Request,
  ) {
    await this.assertCanManageAssignment(
      req,
      input.id,
    );

    return this.assignmentsService.update(input);
  }

  /**
   * Task 10:
   * Delete assignment.
   * Related submissions and grades are deleted by Prisma cascade.
   */
  @Mutation(() => Assignment)
  async removeAssignment(
    @Args('id', {
      type: () => Int,
    })
    id: number,
    @Context('req') req: Request,
  ) {
    await this.assertCanManageAssignment(
      req,
      id,
    );

    return this.assignmentsService.remove(id);
  }
}