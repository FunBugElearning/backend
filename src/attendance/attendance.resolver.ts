import {
  Args,
  Context,
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

import { AttendanceService } from './attendance.service';
import { AttendanceSession } from './entities/attendance-session.entity';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { AttendanceSessionPagination } from './entities/attendance-session-pagination.entity';
import { CreateAttendanceSessionInput } from './dto/create-attendance-session.input';
import { BulkUpsertAttendanceRecordsInput } from './dto/bulk-upsert-attendance-records.input';
import { GetAttendanceSessionsInput } from './dto/get-attendance-sessions.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { verifyAuthenticatedUser } from 'src/middleware/role-authorization.middleware';

@Resolver(() => AttendanceSession)
export class AttendanceResolver {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Admin được tạo attendance session cho mọi class.
   * Teacher chỉ được tạo attendance session cho class mình đang dạy.
   */
  private async assertCanManageAttendanceClass(
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
        'Teacher can only manage attendance for classes they teach',
      );
    }

    return validation.userId;
  }

  /**
   * Admin được quản lý mọi attendance session.
   * Teacher chỉ được quản lý session của class mình đang dạy.
   */
  private async assertCanManageAttendanceSession(
    req: Request,
    attendanceSessionId: number,
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

    const attendanceSession =
      await this.prisma.attendanceSession.findUnique({
        where: {
          id: attendanceSessionId,
        },
        select: {
          id: true,
          class: {
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
          },
        },
      });

    if (!attendanceSession) {
      throw new NotFoundException(
        'Attendance session is not found',
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
      attendanceSession.class.teachers.length > 0;

    if (!isTeacherOfClass) {
      throw new ForbiddenException(
        'Teacher can only manage attendance for classes they teach',
      );
    }

    return validation.userId;
  }

  /**
   * Admin xem được mọi class.
   * Teacher/Student chỉ xem attendance của class mình thuộc về.
   */
  private async assertCanViewAttendanceClass(
    req: Request,
    classId: number,
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
      throw new NotFoundException(
        'Class is not found',
      );
    }

    const role =
      validation.role.toLowerCase();

    if (role === 'admin') {
      return;
    }

    const belongsToClass =
      classItem.teachers.length > 0 ||
      classItem.students.length > 0;

    if (!belongsToClass) {
      throw new ForbiddenException(
        'You must belong to this class to view attendance sessions',
      );
    }
  }

  /**
   * Task 2:
   * Create attendance session for class.
   */
  @Mutation(() => AttendanceSession)
  async createAttendanceSession(
    @Args('input')
    input: CreateAttendanceSessionInput,
    @Context('req') req: Request,
  ) {
    const currentUserId =
      await this.assertCanManageAttendanceClass(
        req,
        input.classId,
      );

    return this.attendanceService.createAttendanceSession(
      input,
      currentUserId,
    );
  }

  /**
   * Task 3:
   * Bulk create/update attendance records.
   */
  @Mutation(() => [AttendanceRecord])
  async bulkUpsertAttendanceRecords(
    @Args('input')
    input: BulkUpsertAttendanceRecordsInput,
    @Context('req') req: Request,
  ) {
    await this.assertCanManageAttendanceSession(
      req,
      input.attendanceSessionId,
    );

    return this.attendanceService.bulkUpsertAttendanceRecords(
      input,
    );
  }

  /**
   * Task 4:
   * Get attendance sessions by class with pagination/filter/counts.
   */
  @Query(() => AttendanceSessionPagination, {
    name: 'attendanceSessionsByClass',
  })
  async getAttendanceSessionsByClass(
    @Args('input')
    input: GetAttendanceSessionsInput,
    @Context('req') req: Request,
  ) {
    await this.assertCanViewAttendanceClass(
      req,
      input.classId,
    );

    return this.attendanceService.getAttendanceSessionsByClass(
      input,
    );
  }
}