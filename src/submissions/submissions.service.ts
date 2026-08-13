import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { IdSequenceService } from 'src/prisma/id-sequence.service';
import { SubmitAssignmentInput } from './dto/submit-assignment.input';
import { SubmissionStatus } from './entities/submission.entity';
import { NotificationsService } from 'src/notifications/notifications.service';

const SUBMISSION_INCLUDE = {
  assignment: {
    include: {
      class: true,
      category: true,
      createdBy: {
        include: {
          role: true,
        },
      },
    },
  },
  student: {
    include: {
      role: true,
    },
  },
  grade: true,
} as const;

function withStatus<
  T extends {
    submittedAt: Date;
    grade: unknown;
    assignment: { deadline: Date };
  },
>(submission: T): T & { status: SubmissionStatus } {
  const status = submission.grade
    ? SubmissionStatus.graded
    : submission.submittedAt > submission.assignment.deadline
      ? SubmissionStatus.late
      : SubmissionStatus.submitted;

  return { ...submission, status };
}

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idSequence: IdSequenceService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async submitAssignment(input: SubmitAssignmentInput, studentId: number) {
    const content = input.content?.trim();
    const attachFiles = input.attachFiles ?? [];

    if (!content && attachFiles.length === 0) {
      throw new BadRequestException(
        'Submission content or attach files is required',
      );
    }

    const assignment = await this.prisma.assignment.findUnique({
      where: {
        id: input.assignmentId,
      },
      include: {
        class: {
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
            teachers: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment is not found');
    }

    const isStudentOfClass = assignment.class.students.length > 0;

    if (!isStudentOfClass) {
      throw new ForbiddenException(
        'Student can only submit assignments for classes they belong to',
      );
    }

    if (assignment.status !== 'published') {
      throw new ForbiddenException(
        assignment.status === 'draft'
          ? 'This assignment has not been published yet'
          : 'This assignment is closed and no longer accepts submissions',
      );
    }

    const existingSubmission = await this.prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: input.assignmentId,
          studentId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingSubmission && !assignment.allowResubmit) {
      throw new ForbiddenException(
        'This assignment does not allow resubmission',
      );
    }

    const newSubmissionId = await this.idSequence.next('Submission');

    const submission = await this.prisma.submission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: input.assignmentId,
          studentId,
        },
      },
      update: {
        content: content || null,
        attachFiles,
        submittedAt: new Date(),
      },
      create: {
        id: newSubmissionId,
        assignmentId: input.assignmentId,
        studentId,
        content: content || null,
        attachFiles,
      },
      include: SUBMISSION_INCLUDE,
    });

    const teacherIds = assignment.class.teachers.map((teacher) => teacher.id);

    await this.notificationsService.createMany(
      teacherIds,
      'submission_received',
      `${submission.student.name} submitted ${assignment.title}`,
      undefined,
      `/classes/${assignment.classId}/assignments`,
    );

    return withStatus(submission);
  }

  async findMyByAssignment(assignmentId: number, studentId: number) {
    const submission = await this.prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
      include: SUBMISSION_INCLUDE,
    });

    if (!submission) {
      return null;
    }

    return withStatus(submission);
  }

  async findByAssignment(assignmentId: number) {
    const assignment = await this.prisma.assignment.findUnique({
      where: {
        id: assignmentId,
      },
      select: {
        id: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment is not found');
    }

    const submissions = await this.prisma.submission.findMany({
      where: {
        assignmentId,
      },
      orderBy: {
        submittedAt: 'desc',
      },
      include: SUBMISSION_INCLUDE,
    });

    return submissions.map(withStatus);
  }
}
