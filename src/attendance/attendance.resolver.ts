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
import { CreateAttendanceSessionInput } from './dto/create-attendance-session.input';
import { UpdateAttendanceRecordInput } from './dto/update-attendance-record.input';
import { CreateAttendanceRecordsInput } from './dto/create-attendance-records.input';
import { UpdateAttendanceRecordsInput } from './dto/update-attendance-records.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { verifyAuthenticatedUser } from 'src/middleware/role-authorization.middleware';

@Resolver(() => AttendanceSession)
export class AttendanceResolver {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly prisma: PrismaService,
  ) {}

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

  @Mutation(() => [AttendanceRecord])
  async createAttendanceRecords(
    @Args('input')
    input: CreateAttendanceRecordsInput,
    @Context('req') req: Request,
  ) {
    await this.assertCanManageAttendanceSession(req, input.attendanceSessionId);

    return this.attendanceService.createAttendanceRecords(input);
  }

  @Mutation(() => [AttendanceRecord])
  async updateAttendanceRecords(
    @Args('input')
    input: UpdateAttendanceRecordsInput,
    @Context('req') req: Request,
  ) {
    await this.assertCanManageAttendanceSession(req, input.attendanceSessionId);

    return this.attendanceService.updateAttendanceRecords(input);
  }

  @Query(() => AttendanceSessionPagination, {
    name: 'attendanceSessionsByClass',
  })
  async getAttendanceSessionsByClass(
    @Args('classId', {
      type: () => Int,
    })
    classId: number,

    @Args('page', {
      type: () => Int,
      nullable: true,
    })
    page: number | undefined,

    @Args('limit', {
      type: () => Int,
      nullable: true,
    })
    limit: number | undefined,

    @Args('fromDate', {
      type: () => String,
      nullable: true,
    })
    fromDate: string | undefined,

    @Args('toDate', {
      type: () => String,
      nullable: true,
    })
    toDate: string | undefined,

    @Context('req') req: Request,
  ) {
    await this.assertCanViewAttendanceClass(req, classId);

    return this.attendanceService.getAttendanceSessionsByClass({
      classId,
      page,
      limit,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    });
  }

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

  @Mutation(() => AttendanceRecord)
  async updateAttendanceRecord(
    @Args('input')
    input: UpdateAttendanceRecordInput,
    @Context('req') req: Request,
  ) {
    await this.assertCanManageAttendanceRecord(req, input.attendanceRecordId);

    return this.attendanceService.updateAttendanceRecord(input);
  }
}