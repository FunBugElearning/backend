import { Args, Context, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
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
import { AttendanceGrid } from './entities/attendance-grid.entity';
import {
  ClassAttendanceStatistics,
  StudentAttendanceStatistics,
} from './entities/attendance-statistics.entity';
import { StudentAttendanceHistoryEntry } from './entities/student-attendance-history-entry.entity';
import { CreateAttendanceSessionInput } from './dto/create-attendance-session.input';
import { BulkUpsertAttendanceRecordsInput } from './dto/bulk-upsert-attendance-records.input';
import { GetAttendanceSessionsInput } from './dto/get-attendance-sessions.input';
import { UpdateAttendanceRecordInput } from './dto/update-attendance-record.input';
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
    const validation = await verifyAuthenticatedUser(req, this.prisma);

    if (!validation.ok) {
      throw new UnauthorizedException(validation.message);
    }

    const attendanceSession = await this.prisma.attendanceSession.findUnique({
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
      throw new NotFoundException('Attendance session is not found');
    }

    const role = validation.role.toLowerCase();

    if (role === 'admin') {
      return validation.userId;
    }

    if (role !== 'teacher') {
      throw new ForbiddenException('Admin or teacher role is required');
    }

    const isTeacherOfClass = attendanceSession.class.teachers.length > 0;

    if (!isTeacherOfClass) {
      throw new ForbiddenException(
        'Teacher can only manage attendance for classes they teach',
      );
    }

    return validation.userId;
  }

  /**
   * Admin được update mọi attendance record.
   * Teacher chỉ được update record của class mình đang dạy.
   */
  private async assertCanManageAttendanceRecord(
    req: Request,
    attendanceRecordId: number,
  ): Promise<number> {
    const validation = await verifyAuthenticatedUser(req, this.prisma);

    if (!validation.ok) {
      throw new UnauthorizedException(validation.message);
    }

    const attendanceRecord = await this.prisma.attendanceRecord.findUnique({
      where: {
        id: attendanceRecordId,
      },
      select: {
        id: true,
        attendanceSession: {
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

    if (!attendanceRecord) {
      throw new NotFoundException('Attendance record is not found');
    }

    const role = validation.role.toLowerCase();

    if (role === 'admin') {
      return validation.userId;
    }

    if (role !== 'teacher') {
      throw new ForbiddenException('Admin or teacher role is required');
    }

    const isTeacherOfClass =
      attendanceRecord.attendanceSession.class.teachers.length > 0;

    if (!isTeacherOfClass) {
      throw new ForbiddenException(
        'Teacher can only update attendance records for classes they teach',
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
        'You must belong to this class to view attendance sessions',
      );
    }
  }

  /**
   * Admin xem được mọi attendance session.
   * Teacher/Student chỉ xem session của class mình thuộc về.
   */
  private async assertCanViewAttendanceSession(
    req: Request,
    attendanceSessionId: number,
  ): Promise<void> {
    const validation = await verifyAuthenticatedUser(req, this.prisma);

    if (!validation.ok) {
      throw new UnauthorizedException(validation.message);
    }

    const attendanceSession = await this.prisma.attendanceSession.findUnique({
      where: {
        id: attendanceSessionId,
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
            students: {
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
      throw new NotFoundException('Attendance session is not found');
    }

    const role = validation.role.toLowerCase();

    if (role === 'admin') {
      return;
    }

    const belongsToClass =
      attendanceSession.class.teachers.length > 0 ||
      attendanceSession.class.students.length > 0;

    if (!belongsToClass) {
      throw new ForbiddenException(
        'You must belong to this class to view attendance session detail',
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
    const currentUserId = await this.assertCanManageAttendanceClass(
      req,
      input.classId,
    );

    return this.attendanceService.createAttendanceSession(input, currentUserId);
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
    await this.assertCanManageAttendanceSession(req, input.attendanceSessionId);

    return this.attendanceService.bulkUpsertAttendanceRecords(input);
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
    await this.assertCanViewAttendanceClass(req, input.classId);

    return this.attendanceService.getAttendanceSessionsByClass(input);
  }

  /**
   * Task 5:
   * Get detail attendance session with students statuses/notes.
   */
  @Query(() => AttendanceSession, {
    name: 'attendanceSessionDetail',
  })
  async getAttendanceSessionDetail(
    @Args('attendanceSessionId', {
      type: () => Int,
    })
    attendanceSessionId: number,
    @Context('req') req: Request,
  ) {
    await this.assertCanViewAttendanceSession(req, attendanceSessionId);

    return this.attendanceService.getAttendanceSessionDetail(
      attendanceSessionId,
    );
  }

  /**
   * Task 6:
   * Update one attendance record.
   */
  @Mutation(() => AttendanceRecord)
  async updateAttendanceRecord(
    @Args('input')
    input: UpdateAttendanceRecordInput,
    @Context('req') req: Request,
  ) {
    await this.assertCanManageAttendanceRecord(req, input.attendanceRecordId);

    return this.attendanceService.updateAttendanceRecord(input);
  }

  /**
   * Full students x sessions x status grid for one class, in one round trip.
   * Admin sees any class; teacher must teach the class. Deliberately NOT
   * open to students — the grid exposes every classmate's attendance, which
   * students must not see (they get `myAttendanceHistory`/
   * `myAttendanceStatistics` instead).
   */
  @Query(() => AttendanceGrid, { name: 'attendanceGrid' })
  async getAttendanceGrid(
    @Args('classId', { type: () => Int }) classId: number,
    @Context('req') req: Request,
  ) {
    await this.assertCanManageAttendanceClass(req, classId);

    return this.attendanceService.getAttendanceGrid(classId);
  }

  /**
   * Class-wide attendance percentage. Admin or the class's own teacher only
   * — same visibility rule as the grid.
   */
  @Query(() => ClassAttendanceStatistics, {
    name: 'classAttendanceStatistics',
  })
  async getClassAttendanceStatistics(
    @Args('classId', { type: () => Int }) classId: number,
    @Context('req') req: Request,
  ) {
    await this.assertCanManageAttendanceClass(req, classId);

    return this.attendanceService.getClassAttendanceStatistics(classId);
  }

  /**
   * The calling student's own attendance percentage for a class. studentId
   * is always taken from the verified token, never a client argument.
   */
  @Query(() => StudentAttendanceStatistics, {
    name: 'myAttendanceStatistics',
  })
  async getMyAttendanceStatistics(
    @Args('classId', { type: () => Int }) classId: number,
    @Context('req') req: Request,
  ) {
    const validation = await verifyAuthenticatedUser(req, this.prisma);

    if (!validation.ok) {
      throw new UnauthorizedException(validation.message);
    }

    return this.attendanceService.getStudentAttendanceStatistics(
      classId,
      validation.userId,
    );
  }

  /**
   * The calling student's own per-session attendance history for a class.
   * studentId is always taken from the verified token.
   */
  @Query(() => [StudentAttendanceHistoryEntry], {
    name: 'myAttendanceHistory',
  })
  async getMyAttendanceHistory(
    @Args('classId', { type: () => Int }) classId: number,
    @Context('req') req: Request,
  ) {
    const validation = await verifyAuthenticatedUser(req, this.prisma);

    if (!validation.ok) {
      throw new UnauthorizedException(validation.message);
    }

    return this.attendanceService.getStudentAttendanceHistory(
      classId,
      validation.userId,
    );
  }
}
