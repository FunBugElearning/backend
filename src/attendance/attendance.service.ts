import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAttendanceSessionInput } from './dto/create-attendance-session.input';
import { BulkUpsertAttendanceRecordsInput } from './dto/bulk-upsert-attendance-records.input';
import { GetAttendanceSessionsInput } from './dto/get-attendance-sessions.input';
import { UpdateAttendanceRecordInput } from './dto/update-attendance-record.input';
import { CreateAttendanceRecordsInput } from './dto/create-attendance-records.input';
import { UpdateAttendanceRecordsInput } from './dto/update-attendance-records.input';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

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

  /**
   * Old API: upsert create/update chung.
   * Mình giữ lại tạm thời để tránh lỗi compile.
   * Sau bước resolver mình sẽ không dùng mutation này nữa.
   */
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

    return this.prisma.$transaction(
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
  }

  async createAttendanceRecords(input: CreateAttendanceRecordsInput) {
    if (input.records.length === 0) {
      throw new BadRequestException('Records cannot be empty');
    }

    const studentIds = input.records.map((record) => record.studentId);
    const uniqueStudentIds = [...new Set(studentIds)];

    if (studentIds.length !== uniqueStudentIds.length) {
      throw new BadRequestException('Duplicate studentId in request body');
    }

    const attendanceSession = await this.prisma.attendanceSession.findUnique({
      where: {
        id: input.attendanceSessionId,
      },
      include: {
        class: {
          include: {
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
        `Student(s) ${invalidStudentIds.join(
          ', ',
        )} do not belong to this class`,
      );
    }

    const existingRecords = await this.prisma.attendanceRecord.findMany({
      where: {
        attendanceSessionId: input.attendanceSessionId,
        studentId: {
          in: uniqueStudentIds,
        },
      },
      select: {
        studentId: true,
      },
    });

    if (existingRecords.length > 0) {
      const existingStudentIds = existingRecords.map(
        (record) => record.studentId,
      );

      throw new ConflictException(
        `Attendance record already exists for student(s): ${existingStudentIds.join(
          ', ',
        )}`,
      );
    }

    return this.prisma.$transaction(
      input.records.map((record) =>
        this.prisma.attendanceRecord.create({
          data: {
            attendanceSessionId: input.attendanceSessionId,
            studentId: record.studentId,
            status: record.status,
            note: record.note?.trim() || null,
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
  }

  async updateAttendanceRecords(input: UpdateAttendanceRecordsInput) {
    if (input.records.length === 0) {
      throw new BadRequestException('Records cannot be empty');
    }

    const studentIds = input.records.map((record) => record.studentId);
    const uniqueStudentIds = [...new Set(studentIds)];

    if (studentIds.length !== uniqueStudentIds.length) {
      throw new BadRequestException('Duplicate studentId in request body');
    }

    const attendanceSession = await this.prisma.attendanceSession.findUnique({
      where: {
        id: input.attendanceSessionId,
      },
      include: {
        class: {
          include: {
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
        `Student(s) ${invalidStudentIds.join(
          ', ',
        )} do not belong to this class`,
      );
    }

    const existingRecords = await this.prisma.attendanceRecord.findMany({
      where: {
        attendanceSessionId: input.attendanceSessionId,
        studentId: {
          in: uniqueStudentIds,
        },
      },
      select: {
        studentId: true,
      },
    });

    const existingStudentIds = new Set(
      existingRecords.map((record) => record.studentId),
    );

    const missingStudentIds = uniqueStudentIds.filter(
      (studentId) => !existingStudentIds.has(studentId),
    );

    if (missingStudentIds.length > 0) {
      throw new NotFoundException(
        `Attendance record does not exist for student(s): ${missingStudentIds.join(
          ', ',
        )}`,
      );
    }

    return this.prisma.$transaction(
      input.records.map((record) =>
        this.prisma.attendanceRecord.update({
          where: {
            attendanceSessionId_studentId: {
              attendanceSessionId: input.attendanceSessionId,
              studentId: record.studentId,
            },
          },
          data: {
            status: record.status,
            note: record.note?.trim() || null,
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