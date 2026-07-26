import { Injectable } from '@nestjs/common';
import { AttendanceStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

interface AttendanceCounts {
  present: number;
  absent: number;
  late: number;
  excused: number;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // Same formula as AttendanceService.computeAttendanceStatistics — excused is
  // excluded from the denominator, late counts as attended. See
  // .claude/DECISIONS.md ("Attendance percentage formula").
  private summarizeAttendance(
    grouped: { status: AttendanceStatus; _count: number }[],
  ) {
    const counts: AttendanceCounts = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };

    for (const row of grouped) {
      counts[row.status] = row._count;
    }

    const attendedOrMissed = counts.present + counts.late + counts.absent;
    const attendanceRate =
      attendedOrMissed === 0
        ? 0
        : ((counts.present + counts.late) / attendedOrMissed) * 100;

    return {
      totalSessions:
        counts.present + counts.absent + counts.late + counts.excused,
      ...counts,
      attendanceRate: Number(attendanceRate.toFixed(2)),
    };
  }

  async getAdminDashboard() {
    const [totalClasses, totalTeachers, totalStudents, totalAssignments] =
      await Promise.all([
        this.prisma.class.count(),
        this.prisma.user.count({
          where: { role: { name: { equals: 'teacher', mode: 'insensitive' } } },
        }),
        this.prisma.user.count({
          where: { role: { name: { equals: 'student', mode: 'insensitive' } } },
        }),
        this.prisma.assignment.count(),
      ]);

    const publishedAssignments = await this.prisma.assignment.findMany({
      where: { status: 'published' },
      select: {
        id: true,
        class: { select: { students: { select: { id: true } } } },
      },
    });

    const totalExpectedSubmissions = publishedAssignments.reduce(
      (sum, assignment) => sum + assignment.class.students.length,
      0,
    );

    const publishedAssignmentIds = publishedAssignments.map((a) => a.id);

    const totalSubmissions =
      publishedAssignmentIds.length === 0
        ? 0
        : await this.prisma.submission.count({
            where: { assignmentId: { in: publishedAssignmentIds } },
          });

    const submissionCompletionRate =
      totalExpectedSubmissions === 0
        ? 0
        : (totalSubmissions / totalExpectedSubmissions) * 100;

    const attendanceGrouped = await this.prisma.attendanceRecord.groupBy({
      by: ['status'],
      _count: true,
    });

    const { attendanceRate } = this.summarizeAttendance(attendanceGrouped);

    const recentSubmissionsRaw = await this.prisma.submission.findMany({
      orderBy: { submittedAt: 'desc' },
      take: 8,
      include: {
        student: { select: { name: true } },
        assignment: {
          select: {
            title: true,
            classId: true,
            class: { select: { name: true } },
          },
        },
      },
    });

    const recentActivity = recentSubmissionsRaw.map((submission) => ({
      submissionId: submission.id,
      studentName: submission.student.name,
      assignmentTitle: submission.assignment.title,
      classId: submission.assignment.classId,
      className: submission.assignment.class.name,
      submittedAt: submission.submittedAt,
    }));

    return {
      totalClasses,
      totalTeachers,
      totalStudents,
      totalAssignments,
      submissionCompletionRate: Number(submissionCompletionRate.toFixed(2)),
      attendanceRate,
      recentActivity,
    };
  }

  async getTeacherDashboard(teacherId: number) {
    const classes = await this.prisma.class.findMany({
      where: { teachers: { some: { id: teacherId } } },
      select: { id: true, name: true, students: { select: { id: true } } },
      orderBy: { name: 'asc' },
    });

    const classIds = classes.map((c) => c.id);
    const totalStudents = new Set(
      classes.flatMap((c) => c.students.map((s) => s.id)),
    ).size;

    const classSummaries = classes.map((c) => ({
      classId: c.id,
      className: c.name,
      studentCount: c.students.length,
    }));

    if (classIds.length === 0) {
      return {
        classes: [],
        totalStudents: 0,
        assignmentsAwaitingGrading: 0,
        recentSubmissions: [],
        upcomingDeadlines: [],
        todayAttendance: [],
      };
    }

    const assignmentsAwaitingGrading = await this.prisma.submission.count({
      where: {
        assignment: { classId: { in: classIds } },
        grade: null,
      },
    });

    const recentSubmissionsRaw = await this.prisma.submission.findMany({
      where: { assignment: { classId: { in: classIds } } },
      orderBy: { submittedAt: 'desc' },
      take: 8,
      include: {
        student: { select: { name: true } },
        assignment: {
          select: {
            title: true,
            classId: true,
            class: { select: { name: true } },
          },
        },
      },
    });

    const recentSubmissions = recentSubmissionsRaw.map((submission) => ({
      submissionId: submission.id,
      studentName: submission.student.name,
      assignmentTitle: submission.assignment.title,
      classId: submission.assignment.classId,
      className: submission.assignment.class.name,
      submittedAt: submission.submittedAt,
    }));

    const now = new Date();

    const upcomingRaw = await this.prisma.assignment.findMany({
      where: {
        classId: { in: classIds },
        status: 'published',
        deadline: { gte: now },
      },
      orderBy: { deadline: 'asc' },
      take: 5,
      include: { class: { select: { name: true } } },
    });

    const upcomingDeadlines = upcomingRaw.map((assignment) => ({
      assignmentId: assignment.id,
      title: assignment.title,
      classId: assignment.classId,
      className: assignment.class.name,
      deadline: assignment.deadline,
    }));

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const sessionsToday = await this.prisma.attendanceSession.findMany({
      where: {
        classId: { in: classIds },
        attendanceDate: { gte: startOfToday, lte: endOfToday },
      },
      select: { classId: true },
    });

    const classIdsWithSessionToday = new Set(
      sessionsToday.map((session) => session.classId),
    );

    const todayAttendance = classes.map((c) => ({
      classId: c.id,
      className: c.name,
      hasSessionToday: classIdsWithSessionToday.has(c.id),
    }));

    return {
      classes: classSummaries,
      totalStudents,
      assignmentsAwaitingGrading,
      recentSubmissions,
      upcomingDeadlines,
      todayAttendance,
    };
  }

  async getStudentDashboard(studentId: number) {
    const classes = await this.prisma.class.findMany({
      where: { students: { some: { id: studentId } } },
      select: {
        id: true,
        name: true,
        teachers: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });

    const classIds = classes.map((c) => c.id);
    const classSummaries = classes.map((c) => ({
      classId: c.id,
      className: c.name,
      teacherNames: c.teachers.map((teacher) => teacher.name),
    }));

    const attendanceGrouped = await this.prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: { studentId },
      _count: true,
    });

    const attendance = this.summarizeAttendance(attendanceGrouped);

    const latestNotifications = await this.prisma.notification.findMany({
      where: { userId: studentId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (classIds.length === 0) {
      return {
        classes: [],
        upcomingAssignments: [],
        overdueAssignments: [],
        recentGrades: [],
        attendance,
        latestNotifications,
      };
    }

    const now = new Date();

    const publishedAssignments = await this.prisma.assignment.findMany({
      where: { classId: { in: classIds }, status: 'published' },
      include: {
        class: { select: { name: true } },
        submissions: { where: { studentId }, select: { id: true } },
      },
    });

    const unsubmitted = publishedAssignments.filter(
      (assignment) => assignment.submissions.length === 0,
    );

    const toSummary = (assignment: (typeof unsubmitted)[number]) => ({
      assignmentId: assignment.id,
      title: assignment.title,
      classId: assignment.classId,
      className: assignment.class.name,
      deadline: assignment.deadline,
    });

    const upcomingAssignments = unsubmitted
      .filter((assignment) => assignment.deadline >= now)
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
      .slice(0, 5)
      .map(toSummary);

    const overdueAssignments = unsubmitted
      .filter((assignment) => assignment.deadline < now)
      .sort((a, b) => b.deadline.getTime() - a.deadline.getTime())
      .slice(0, 5)
      .map(toSummary);

    const recentGradesRaw = await this.prisma.grade.findMany({
      where: { submission: { studentId } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        submission: {
          include: {
            assignment: {
              select: {
                id: true,
                title: true,
                classId: true,
                maxScore: true,
                class: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    const recentGrades = recentGradesRaw.map((grade) => ({
      assignmentId: grade.submission.assignment.id,
      assignmentTitle: grade.submission.assignment.title,
      classId: grade.submission.assignment.classId,
      className: grade.submission.assignment.class.name,
      score: grade.score,
      maxScore: grade.submission.assignment.maxScore,
      gradedAt: grade.createdAt,
    }));

    return {
      classes: classSummaries,
      upcomingAssignments,
      overdueAssignments,
      recentGrades,
      attendance,
      latestNotifications,
    };
  }
}
