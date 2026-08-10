import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { GradeSubmissionInput } from './dto/grade-submission.input';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class GradesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async gradeSubmission(input: GradeSubmissionInput, gradedById: number) {
    const submission = await this.prisma.submission.findUnique({
      where: {
        id: input.submissionId,
      },
      include: {
        assignment: {
          include: {
            class: true,
            category: true,
          },
        },
        student: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission is not found');
    }

    if (input.score > submission.assignment.maxScore) {
      throw new BadRequestException(
        `Score cannot exceed assignment max score ${submission.assignment.maxScore}`,
      );
    }

    const grade = await this.prisma.grade.upsert({
      where: {
        submissionId: input.submissionId,
      },
      update: {
        score: input.score,
        feedback: input.feedback?.trim() || null,
        gradedById,
      },
      create: {
        submissionId: input.submissionId,
        score: input.score,
        feedback: input.feedback?.trim() || null,
        gradedById,
      },
      include: {
        gradedBy: {
          include: {
            role: true,
          },
        },
        submission: {
          include: {
            student: {
              include: {
                role: true,
              },
            },
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
          },
        },
      },
    });

    await this.notificationsService.create(
      submission.student.id,
      'submission_graded',
      `Your submission for ${submission.assignment.title} was graded`,
      undefined,
      `/classes/${submission.assignment.classId}/assignments`,
    );

    return grade;
  }
}
