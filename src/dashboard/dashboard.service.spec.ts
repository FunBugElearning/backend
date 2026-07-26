import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: {
    class: { count: jest.Mock; findMany: jest.Mock };
    user: { count: jest.Mock };
    assignment: { count: jest.Mock; findMany: jest.Mock };
    submission: { count: jest.Mock; findMany: jest.Mock };
    attendanceRecord: { groupBy: jest.Mock };
    attendanceSession: { findMany: jest.Mock };
    notification: { findMany: jest.Mock };
    grade: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      class: { count: jest.fn(), findMany: jest.fn() },
      user: { count: jest.fn() },
      assignment: { count: jest.fn(), findMany: jest.fn() },
      submission: { count: jest.fn(), findMany: jest.fn() },
      attendanceRecord: { groupBy: jest.fn() },
      attendanceSession: { findMany: jest.fn() },
      notification: { findMany: jest.fn() },
      grade: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAdminDashboard', () => {
    it("weights submission completion rate by each published assignment's class size", async () => {
      prisma.class.count.mockResolvedValue(2);
      prisma.user.count.mockResolvedValueOnce(2).mockResolvedValueOnce(10);
      prisma.assignment.count.mockResolvedValue(5);
      // Two published assignments: one in a 6-student class, one in a 4-student class.
      // Expected submissions = 6 + 4 = 10.
      prisma.assignment.findMany.mockResolvedValue([
        { id: 1, class: { students: Array(6).fill({ id: 1 }) } },
        { id: 2, class: { students: Array(4).fill({ id: 1 }) } },
      ]);
      prisma.submission.count.mockResolvedValue(5);
      prisma.attendanceRecord.groupBy.mockResolvedValue([]);
      prisma.submission.findMany.mockResolvedValue([]);

      const result = await service.getAdminDashboard();

      expect(result.submissionCompletionRate).toBe(50);
      expect(result.totalClasses).toBe(2);
      expect(result.totalTeachers).toBe(2);
      expect(result.totalStudents).toBe(10);
    });

    it('returns 0% completion when there are no published assignments', async () => {
      prisma.class.count.mockResolvedValue(0);
      prisma.user.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
      prisma.assignment.count.mockResolvedValue(0);
      prisma.assignment.findMany.mockResolvedValue([]);
      prisma.attendanceRecord.groupBy.mockResolvedValue([]);
      prisma.submission.findMany.mockResolvedValue([]);

      const result = await service.getAdminDashboard();

      expect(result.submissionCompletionRate).toBe(0);
      expect(prisma.submission.count).not.toHaveBeenCalled();
    });
  });

  describe('getStudentDashboard', () => {
    it('computes the attendance summary using the shared formula', async () => {
      prisma.class.findMany.mockResolvedValue([
        { id: 1, name: 'Math 101', teachers: [{ name: 'Ms. Linh' }] },
      ]);
      prisma.attendanceRecord.groupBy.mockResolvedValue([
        { status: 'present', _count: 3 },
        { status: 'late', _count: 1 },
        { status: 'absent', _count: 1 },
      ]);
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.assignment.findMany.mockResolvedValue([]);
      prisma.grade.findMany.mockResolvedValue([]);

      const result = await service.getStudentDashboard(5);

      // (present + late) / (present + late + absent) = (3+1)/(3+1+1) = 80%
      expect(result.attendance.attendanceRate).toBe(80);
      expect(result.classes).toEqual([
        { classId: 1, className: 'Math 101', teacherNames: ['Ms. Linh'] },
      ]);
    });

    it('returns empty collections for a student with no classes, without querying assignments', async () => {
      prisma.class.findMany.mockResolvedValue([]);
      prisma.attendanceRecord.groupBy.mockResolvedValue([]);
      prisma.notification.findMany.mockResolvedValue([]);

      const result = await service.getStudentDashboard(5);

      expect(result.upcomingAssignments).toEqual([]);
      expect(result.overdueAssignments).toEqual([]);
      expect(prisma.assignment.findMany).not.toHaveBeenCalled();
    });

    it('separates unsubmitted assignments into upcoming vs. overdue by deadline', async () => {
      const now = Date.now();

      prisma.class.findMany.mockResolvedValue([
        { id: 1, name: 'Math 101', teachers: [] },
      ]);
      prisma.attendanceRecord.groupBy.mockResolvedValue([]);
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.assignment.findMany.mockResolvedValue([
        {
          id: 1,
          title: 'Future Quiz',
          classId: 1,
          class: { name: 'Math 101' },
          deadline: new Date(now + 86400000),
          submissions: [],
        },
        {
          id: 2,
          title: 'Past Quiz',
          classId: 1,
          class: { name: 'Math 101' },
          deadline: new Date(now - 86400000),
          submissions: [],
        },
        {
          id: 3,
          title: 'Already submitted',
          classId: 1,
          class: { name: 'Math 101' },
          deadline: new Date(now + 86400000),
          submissions: [{ id: 1 }],
        },
      ]);
      prisma.grade.findMany.mockResolvedValue([]);

      const result = await service.getStudentDashboard(5);

      expect(result.upcomingAssignments.map((a) => a.title)).toEqual([
        'Future Quiz',
      ]);
      expect(result.overdueAssignments.map((a) => a.title)).toEqual([
        'Past Quiz',
      ]);
    });
  });
});
