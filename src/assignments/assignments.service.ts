import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAssignmentInput } from './dto/create-assignment.input';
import { UpdateAssignmentInput } from './dto/update-assignment.input';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.assignment.create({
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

  async findByClassId(classId: number) {
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

  async findByUserAndClass(userId: number, classId: number) {
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

    const belongsToClass =
      classItem.teachers.length > 0 || classItem.students.length > 0;

    if (!belongsToClass) {
      throw new ForbiddenException('User does not belong to this class');
    }

    return this.prisma.assignment.findMany({
      where: {
        classId,
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
      select: {
        id: true,
      },
    });

    if (!classMembership) {
      throw new ForbiddenException(
        'You do not have permission to view this assignment',
      );
    }

    return assignment;
  }

  async update(input: UpdateAssignmentInput) {
    const assignment = await this.prisma.assignment.findUnique({
      where: {
        id: input.id,
      },
      select: {
        id: true,
        classId: true,
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

    return this.prisma.assignment.update({
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