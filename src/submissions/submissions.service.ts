import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { SubmitAssignmentInput } from './dto/submit-assignment.input';

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.submission.upsert({
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
        assignmentId: input.assignmentId,
        studentId,
        content: content || null,
        attachFiles,
      },
      include: {
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
      },
    });
  }
}
