import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { IdSequenceService } from 'src/prisma/id-sequence.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { AttendanceService } from './attendance.service';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let prisma: {
    class: { findUnique: jest.Mock };
    attendanceSession: { findUnique: jest.Mock; findMany: jest.Mock };
    attendanceRecord: { upsert: jest.Mock; findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let notificationsService: { createMany: jest.Mock };
  let idSequence: { next: jest.Mock };

  beforeEach(async () => {
    prisma = {
      class: { findUnique: jest.fn() },
      attendanceSession: { findUnique: jest.fn(), findMany: jest.fn() },
      attendanceRecord: { upsert: jest.fn(), findMany: jest.fn() },
      $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    };

    notificationsService = { createMany: jest.fn() };
    let nextId = 200;
    idSequence = { next: jest.fn(() => Promise.resolve(++nextId)) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: IdSequenceService, useValue: idSequence },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('bulkUpsertAttendanceRecords', () => {
    it('rejects an empty records array', async () => {
      await expect(
        service.bulkUpsertAttendanceRecords({
          attendanceSessionId: 1,
          records: [],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects duplicate student IDs in the same call', async () => {
      await expect(
        service.bulkUpsertAttendanceRecords({
          attendanceSessionId: 1,
          records: [
            { studentId: 5, status: 'present' },
            { studentId: 5, status: 'absent' },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when the attendance session does not exist', async () => {
      prisma.attendanceSession.findUnique.mockResolvedValue(null);

      await expect(
        service.bulkUpsertAttendanceRecords({
          attendanceSessionId: 999,
          records: [{ studentId: 5, status: 'present' }],
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects a student who is not enrolled in the class', async () => {
      prisma.attendanceSession.findUnique.mockResolvedValue({
        id: 1,
        classId: 10,
        class: { students: [{ id: 5 }] },
      });

      await expect(
        service.bulkUpsertAttendanceRecords({
          attendanceSessionId: 1,
          records: [{ studentId: 99, status: 'present' }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('upserts valid records and notifies exactly the marked students', async () => {
      prisma.attendanceSession.findUnique.mockResolvedValue({
        id: 1,
        classId: 10,
        class: { students: [{ id: 5 }, { id: 6 }] },
      });
      prisma.attendanceRecord.upsert.mockResolvedValue({ id: 1 });

      await service.bulkUpsertAttendanceRecords({
        attendanceSessionId: 1,
        records: [
          { studentId: 5, status: 'present' },
          { studentId: 6, status: 'late' },
        ],
      });

      expect(prisma.attendanceRecord.upsert).toHaveBeenCalledTimes(2);
      expect(notificationsService.createMany).toHaveBeenCalledWith(
        [5, 6],
        'attendance_updated',
        'Your attendance has been recorded',
        undefined,
        '/classes/10/my-attendance',
      );
    });
  });

  describe('getClassAttendanceStatistics', () => {
    it('computes the attendance rate excluding excused from the denominator', async () => {
      const makeRecords = (status: string, count: number) =>
        Array.from({ length: count }, () => ({ status }));

      prisma.class.findUnique.mockResolvedValue({ id: 10 });
      prisma.attendanceRecord.findMany.mockResolvedValue([
        ...makeRecords('present', 9),
        ...makeRecords('late', 3),
        ...makeRecords('absent', 3),
        ...makeRecords('excused', 3),
      ]);

      const result = await service.getClassAttendanceStatistics(10);

      // (present + late) / (present + late + absent) = (9+3)/(9+3+3) = 80%
      expect(result.attendanceRate).toBe(80);
      expect(result.totalSessions).toBe(18);
    });

    it('throws when the class does not exist', async () => {
      prisma.class.findUnique.mockResolvedValue(null);

      await expect(
        service.getClassAttendanceStatistics(999),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getStudentAttendanceHistory', () => {
    it('rejects a student who does not belong to the class', async () => {
      prisma.class.findUnique.mockResolvedValue({ id: 10, students: [] });

      await expect(
        service.getStudentAttendanceHistory(10, 5),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
