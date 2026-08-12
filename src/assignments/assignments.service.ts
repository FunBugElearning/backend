import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAssignmentInput } from './dto/create-assignment.input';
import { UpdateAssignmentInput } from './dto/update-assignment.input';
import { NotificationsService } from 'src/notifications/notifications.service';
@Injectable()
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async notifyClassStudentsOfPublishedAssignment(
    classId: number,
    assignmentId: number,
    title: string,
  ) {
    const classItem = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { students: { select: { id: true } } },
    });

    const studentIds = classItem?.students.map((student) => student.id) ?? [];

    await this.notificationsService.createMany(
      studentIds,
      'assignment_published',
      `New assignment: ${title}`,
      undefined,
      `/classes/${classId}/assignments`,
    );

    return assignmentId;
  }

  async create(
    createAssignmentInput: CreateAssignmentInput,
    createdById: number,
  ) {
    const title = createAssignmentInput.title.trim();

    if (!title) {
      throw new BadRequestException('Assignment title is required');
    }

    const maxScore = createAssignmentInput.maxScore ?? 100;

    if (maxScore <= 0) {
      throw new BadRequestException('Max score must be greater than 0');
    }

    const classItem = await this.prisma.class.findUnique({
      where: {
        id: createAssignmentInput.classId,
      },
      select: {
        id: true,
      },
    });

    if (!classItem) {
      throw new NotFoundException('Class is not found');
    }

    if (createAssignmentInput.categoryId) {
      const category = await this.prisma.classGradeCategory.findUnique({
        where: {
          id: createAssignmentInput.categoryId,
        },
        select: {
          id: true,
          classId: true,
        },
      });

      if (!category) {
        throw new NotFoundException('Grade category is not found');
      }

      if (category.classId !== createAssignmentInput.classId) {
        throw new BadRequestException(
          'Grade category does not belong to this class',
        );
      }
    }

    const status = createAssignmentInput.status ?? 'draft';

    const created = await this.prisma.assignment.create({
      data: {
        title,
        description: createAssignmentInput.description?.trim() || undefined,
        deadline: new Date(createAssignmentInput.deadline),
        topic: createAssignmentInput.topic?.trim() || undefined,
        attachFiles: createAssignmentInput.attachFiles ?? [],
        classId: createAssignmentInput.classId,
        categoryId: createAssignmentInput.categoryId,
        maxScore,
        createdById,
        status,
        allowResubmit: createAssignmentInput.allowResubmit ?? true,
      },
      include: {
        class: true,
        category: true,
        createdBy: {
          include: {
            role: true,
          },
        },
      },
    });

    if (status === 'published') {
      await this.notifyClassStudentsOfPublishedAssignment(
        created.classId,
        created.id,
        created.title,
      );
    }

    return created;
  }

  async findByUserAndClass(userId: number, classId: number, role: string) {
    const classItem = await this.prisma.class.findUnique({
      where: {
        id: classId,
      },
      include: {
        teachers: {
          where: {
            id: userId,
          },
          select: {
            id: true,
          },
        },
        students: {
          where: {
            id: userId,
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

    const isAdmin = role.toLowerCase() === 'admin';
    const isTeacherOfClass = classItem.teachers.length > 0;
    const isStudentOfClass = classItem.students.length > 0;

    if (!isAdmin && !isTeacherOfClass && !isStudentOfClass) {
      throw new ForbiddenException('User does not belong to this class');
    }

    // Students (and nobody else) never see draft assignments.
    const canSeeDrafts = isAdmin || isTeacherOfClass;

    return this.prisma.assignment.findMany({
      where: {
        classId,
        ...(canSeeDrafts ? {} : { status: 'published' }),
      },
      orderBy: {
        deadline: 'asc',
      },
      include: {
        class: true,
        category: true,
        createdBy: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findByClassId(classId: number, canSeeDrafts: boolean) {
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

    return this.prisma.assignment.findMany({
      where: {
        classId,
        ...(canSeeDrafts ? {} : { status: 'published' }),
      },
      orderBy: {
        deadline: 'asc',
      },
      include: {
        class: true,
        category: true,
        createdBy: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findOne(id: number, userId: number, role: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: {
        id,
      },
      include: {
        class: true,
        category: true,
        createdBy: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment is not found');
    }

    if (role.toLowerCase() === 'admin') {
      return assignment;
    }

    const classMembership = await this.prisma.class.findFirst({
      where: {
        id: assignment.classId,
        OR: [
          {
            teachers: {
              some: {
                id: userId,
              },
            },
          },
          {
            students: {
              some: {
                id: userId,
              },
            },
          },
        ],
      },
      include: {
        teachers: {
          where: {
            id: userId,
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!classMembership) {
      throw new ForbiddenException(
        'You do not have permission to view this assignment',
      );
    }

    const isTeacherOfClass = classMembership.teachers.length > 0;

    if (assignment.status === 'draft' && !isTeacherOfClass) {
      throw new ForbiddenException(
        'This assignment has not been published yet',
      );
    }

    return assignment;
  }

  async publish(id: number) {
    const assignment = await this.prisma.assignment.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment is not found');
    }

    const updated = await this.prisma.assignment.update({
      where: {
        id,
      },
      data: {
        status: 'published',
      },
      include: {
        class: true,
        category: true,
        createdBy: {
          include: {
            role: true,
          },
        },
      },
    });

    await this.notifyClassStudentsOfPublishedAssignment(
      updated.classId,
      updated.id,
      updated.title,
    );

    return updated;
  }
  async update(input: UpdateAssignmentInput) {
    const assignment = await this.prisma.assignment.findUnique({
      where: {
        id: input.id,
      },
      select: {
        id: true,
        classId: true,
        status: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment is not found');
    }

    if (input.title !== undefined) {
      const title = input.title.trim();

      if (!title) {
        throw new BadRequestException('Assignment title is required');
      }
    }

    if (input.maxScore !== undefined && input.maxScore <= 0) {
      throw new BadRequestException('Max score must be greater than 0');
    }

    if (input.categoryId !== undefined) {
      const category = await this.prisma.classGradeCategory.findUnique({
        where: {
          id: input.categoryId,
        },
        select: {
          id: true,
          classId: true,
        },
      });

      if (!category) {
        throw new NotFoundException('Grade category is not found');
      }

      if (category.classId !== assignment.classId) {
        throw new BadRequestException(
          'Grade category does not belong to this class',
        );
      }
    }

    const updated = await this.prisma.assignment.update({
      where: {
        id: input.id,
      },
      data: {
        ...(input.title !== undefined && {
          title: input.title.trim(),
        }),
        ...(input.description !== undefined && {
          description: input.description?.trim() || null,
        }),
        ...(input.deadline !== undefined && {
          deadline: new Date(input.deadline),
        }),
        ...(input.topic !== undefined && {
          topic: input.topic?.trim() || null,
        }),
        ...(input.attachFiles !== undefined && {
          attachFiles: input.attachFiles,
        }),
        ...(input.categoryId !== undefined && {
          categoryId: input.categoryId,
        }),
        ...(input.maxScore !== undefined && {
          maxScore: input.maxScore,
        }),
        ...(input.status !== undefined && {
          status: input.status,
        }),
        ...(input.allowResubmit !== undefined && {
          allowResubmit: input.allowResubmit,
        }),
      },
      include: {
        class: true,
        category: true,
        createdBy: {
          include: {
            role: true,
          },
        },
      },
    });

    if (input.status === 'published' && assignment.status !== 'published') {
      await this.notifyClassStudentsOfPublishedAssignment(
        updated.classId,
        updated.id,
        updated.title,
      );
    }

    return updated;
  }

  async remove(id: number) {
    const assignment = await this.prisma.assignment.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment is not found');
    }

    return this.prisma.assignment.delete({
      where: {
        id,
      },
      include: {
        class: true,
        category: true,
        createdBy: {
          include: {
            role: true,
          },
        },
      },
    });
  }
}