import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAttendanceSessionInput } from './dto/create-attendance-session.input';
import { BulkUpsertAttendanceRecordsInput } from './dto/bulk-upsert-attendance-records.input';
import { GetAttendanceSessionsInput } from './dto/get-attendance-sessions.input';
import { UpdateAttendanceRecordInput } from './dto/update-attendance-record.input';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createAttendanceSession(
    input: CreateAttendanceSessionInput,
    createdById: number,
  ) {
    const classItem = await this.prisma.class.findUnique({
      where: {
        id: input.classId,
      },
      select: {
        id: true,
      },
    });

    if (!classItem) {
      throw new NotFoundException('Class is not found');
    }

    return this.prisma.attendanceSession.create({
      data: {
        classId: input.classId,
        createdById,
        attendanceDate: new Date(input.attendanceDate),
        title: input.title?.trim() || undefined,
        description: input.description?.trim() || undefined,
      },
      include: {
        class: true,
        createdBy: {
          include: {
            role: true,
          },
        },
        records: {
          include: {
            student: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async bulkUpsertAttendanceRecords(input: BulkUpsertAttendanceRecordsInput) {
    if (input.records.length === 0) {
      throw new BadRequestException(
        'At least one attendance record is required',
      );
    }

    const studentIds = input.records.map((record) => record.studentId);

    const uniqueStudentIds = [...new Set(studentIds)];

    if (uniqueStudentIds.length !== studentIds.length) {
      throw new BadRequestException(
        'Duplicate student ID in attendance records',
      );
    }

    const attendanceSession = await this.prisma.attendanceSession.findUnique({
      where: {
        id: input.attendanceSessionId,
      },
      select: {
        id: true,
        classId: true,
        class: {
          select: {
            students: {
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

    const classStudentIds = new Set(
      attendanceSession.class.students.map((student) => student.id),
    );

    const invalidStudentIds = uniqueStudentIds.filter(
      (studentId) => !classStudentIds.has(studentId),
    );

    if (invalidStudentIds.length > 0) {
      throw new BadRequestException(
        `These students are not in class: ${invalidStudentIds.join(', ')}`,
      );
    }

    const results = await this.prisma.$transaction(
      input.records.map((record) =>
        this.prisma.attendanceRecord.upsert({
          where: {
            attendanceSessionId_studentId: {
              attendanceSessionId: input.attendanceSessionId,
              studentId: record.studentId,
            },
          },
          update: {
            status: record.status,
            note: record.note?.trim() || undefined,
          },
          create: {
            attendanceSessionId: input.attendanceSessionId,
            studentId: record.studentId,
            status: record.status,
            note: record.note?.trim() || undefined,
          },
          include: {
            student: {
              include: {
                role: true,
              },
            },
          },
        }),
      ),
    );

    await this.notificationsService.createMany(
      uniqueStudentIds,
      'attendance_updated',
      'Your attendance has been recorded',
      undefined,
      `/classes/${attendanceSession.classId}/my-attendance`,
    );

    return results;
  }

  async getAttendanceSessionsByClass(input: GetAttendanceSessionsInput) {
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;
    const skip = (page - 1) * limit;

    const classItem = await this.prisma.class.findUnique({
      where: {
        id: input.classId,
      },
      select: {
        id: true,
      },
    });

    if (!classItem) {
      throw new NotFoundException('Class is not found');
    }

    const where: Prisma.AttendanceSessionWhereInput = {
      classId: input.classId,
    };

    if (input.fromDate || input.toDate) {
      where.attendanceDate = {
        ...(input.fromDate && {
          gte: new Date(input.fromDate),
        }),
        ...(input.toDate && {
          lte: new Date(input.toDate),
        }),
      };
    }

    const [total, sessions] = await this.prisma.$transaction([
      this.prisma.attendanceSession.count({
        where,
      }),
      this.prisma.attendanceSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          attendanceDate: 'desc',
        },
        include: {
          class: true,
          createdBy: {
            include: {
              role: true,
            },
          },
          records: {
            select: {
              status: true,
            },
          },
        },
      }),
    ]);

    const items = sessions.map((session) => {
      const statusCounts = {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      };

      session.records.forEach((record) => {
        statusCounts[record.status] += 1;
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { records, ...sessionData } = session;

      return {
        ...sessionData,
        statusCounts,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAttendanceSessionDetail(attendanceSessionId: number) {
    const attendanceSession = await this.prisma.attendanceSession.findUnique({
      where: {
        id: attendanceSessionId,
      },
      include: {
        class: true,
        createdBy: {
          include: {
            role: true,
          },
        },
        records: {
          include: {
            student: {
              include: {
                role: true,
              },
            },
          },
          orderBy: {
            studentId: 'asc',
          },
        },
      },
    });

    if (!attendanceSession) {
      throw new NotFoundException('Attendance session is not found');
    }

    return attendanceSession;
  }

  async getAttendanceGrid(classId: number) {
    const classItem = await this.prisma.class.findUnique({
      where: {
        id: classId,
      },
      select: {
        id: true,
        students: {
          include: {
            role: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
    });

    if (!classItem) {
      throw new NotFoundException('Class is not found');
    }

    const sessions = await this.prisma.attendanceSession.findMany({
      where: {
        classId,
      },
      orderBy: {
        attendanceDate: 'asc',
      },
    });

    const sessionIds = sessions.map((session) => session.id);

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        attendanceSessionId: {
          in: sessionIds,
        },
      },
    });

    const recordByStudentAndSession = new Map<
      string,
      (typeof records)[number]
    >();

    for (const record of records) {
      recordByStudentAndSession.set(
        `${record.studentId}:${record.attendanceSessionId}`,
        record,
      );
    }

    const columns = sessions.map((session) => ({
      sessionId: session.id,
      attendanceDate: session.attendanceDate,
      title: session.title,
    }));

    const rows = classItem.students.map((student) => ({
      student,
      cells: sessions.map((session) => {
        const record = recordByStudentAndSession.get(
          `${student.id}:${session.id}`,
        );

        return {
          sessionId: session.id,
          recordId: record?.id ?? null,
          status: record?.status ?? null,
          note: record?.note ?? null,
        };
      }),
    }));

    return { classId, columns, rows };
  }

  // See .claude/DECISIONS.md ("Attendance percentage formula") for why excused
  // is excluded from the denominator and late counts as attended.
  private computeAttendanceStatistics(counts: {
    present: number;
    absent: number;
    late: number;
    excused: number;
  }) {
    const attendedOrMissed = counts.present + counts.late + counts.absent;
    const attendanceRate =
      attendedOrMissed === 0
        ? 0
        : ((counts.present + counts.late) / attendedOrMissed) * 100;

    return {
      totalSessions:
        counts.present + counts.absent + counts.late + counts.excused,
      ...counts,
      attendanceRate,
    };
  }

  async getClassAttendanceStatistics(classId: number) {
    const classItem = await this.prisma.class.findUnique({
      where: {
        id: classId,
      },
      select: {
        id: true,
      },
    });

    if (!classItem) {
      throw new NotFoundException('Class is not found');
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        attendanceSession: {
          classId,
        },
      },
      select: {
        status: true,
      },
    });

    const counts = { present: 0, absent: 0, late: 0, excused: 0 };

    for (const record of records) {
      counts[record.status] += 1;
    }

    return {
      classId,
      ...this.computeAttendanceStatistics(counts),
    };
  }

  async getStudentAttendanceStatistics(classId: number, studentId: number) {
    const classItem = await this.prisma.class.findUnique({
      where: {
        id: classId,
      },
      select: {
        id: true,
      },
    });

    if (!classItem) {
      throw new NotFoundException('Class is not found');
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        studentId,
        attendanceSession: {
          classId,
        },
      },
      select: {
        status: true,
      },
    });

    const counts = { present: 0, absent: 0, late: 0, excused: 0 };

    for (const record of records) {
      counts[record.status] += 1;
    }

    return {
      classId,
      studentId,
      ...this.computeAttendanceStatistics(counts),
    };
  }

  async getStudentAttendanceHistory(classId: number, studentId: number) {
    const classItem = await this.prisma.class.findUnique({
      where: {
        id: classId,
      },
      select: {
        id: true,
        students: {
          where: {
            id: studentId,
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

    if (classItem.students.length === 0) {
      throw new ForbiddenException('Student is not enrolled in this class');
    }

    const sessions = await this.prisma.attendanceSession.findMany({
      where: {
        classId,
      },
      orderBy: {
        attendanceDate: 'asc',
      },
    });

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        studentId,
        attendanceSessionId: {
          in: sessions.map((session) => session.id),
        },
      },
    });

    const recordBySession = new Map(
      records.map((record) => [record.attendanceSessionId, record]),
    );

    return sessions.map((session) => {
      const record = recordBySession.get(session.id);

      return {
        sessionId: session.id,
        attendanceDate: session.attendanceDate,
        title: session.title,
        status: record?.status ?? null,
        note: record?.note ?? null,
      };
    });
  }

  async updateAttendanceRecord(input: UpdateAttendanceRecordInput) {
    const attendanceRecord = await this.prisma.attendanceRecord.findUnique({
      where: {
        id: input.attendanceRecordId,
      },
      select: {
        id: true,
      },
    });

    if (!attendanceRecord) {
      throw new NotFoundException('Attendance record is not found');
    }

    return this.prisma.attendanceRecord.update({
      where: {
        id: input.attendanceRecordId,
      },
      data: {
        status: input.status,
        ...(input.note !== undefined && {
          note: input.note.trim() || null,
        }),
      },
      include: {
        student: {
          include: {
            role: true,
          },
        },
      },
    });
  }
}
