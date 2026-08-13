import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { IdSequenceService } from 'src/prisma/id-sequence.service';
import { Prisma } from '@prisma/client';
import { CreateClassInput } from './dto/create-class.input';
import { UpdateClassInput } from './dto/update-class.input';
import { SearchStudentsInput } from './dto/search-students.input';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class ClassesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idSequence: IdSequenceService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createClassInput: CreateClassInput, createdById: number) {
    const { name, description, teacherIds, studentIds } = createClassInput;

    return this.prisma.class.create({
      data: {
        id: await this.idSequence.next('Class'),
        name,
        description,
        createdById,
        teachers: {
          connect: teacherIds?.map((id) => ({ id })) ?? [],
        },
        students: {
          connect: studentIds?.map((id) => ({ id })) ?? [],
        },
      },
      include: {
        teachers: true,
        students: true,
        createdBy: true,
      },
    });
  }

  async findAll(page = 1, limit = 10) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.class.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          teachers: true,
          students: true,
          createdBy: true,
        },
      }),
      this.prisma.class.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  findOne(id: number) {
    return this.prisma.class.findUnique({
      where: {
        id,
      },
      include: {
        teachers: true,
        students: true,
        createdBy: true,
      },
    });
  }

  async findByUserId(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User is not found');
    }

    return this.prisma.class.findMany({
      where: {
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
        teachers: true,
        students: true,
        createdBy: true,
      },
    });
  }

  update(id: number, updateClassInput: UpdateClassInput) {
    const { name, description, teacherIds, studentIds } = updateClassInput;

    return this.prisma.class.update({
      where: {
        id,
      },
      data: {
        ...(name !== undefined && {
          name,
        }),

        ...(description !== undefined && {
          description,
        }),

        ...(teacherIds !== undefined && {
          teachers: {
            set: teacherIds.map((teacherId) => ({
              id: teacherId,
            })),
          },
        }),

        ...(studentIds !== undefined && {
          students: {
            set: studentIds.map((studentId) => ({
              id: studentId,
            })),
          },
        }),
      },
      include: {
        teachers: true,
        students: true,
        createdBy: true,
      },
    });
  }

  remove(id: number) {
    return this.prisma.class.delete({
      where: {
        id,
      },
      include: {
        teachers: true,
        students: true,
        createdBy: true,
      },
    });
  }

  async assignClassesToTeacher(teacherId: number, classIds: number[]) {
    const uniqueClassIds = [...new Set(classIds)];

    if (uniqueClassIds.length === 0) {
      throw new BadRequestException('At least one class ID is required');
    }

    const teacher = await this.prisma.user.findUnique({
      where: {
        id: teacherId,
      },
      include: {
        role: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher is not found');
    }

    if (teacher.role.name.toLowerCase() !== 'teacher') {
      throw new BadRequestException('Selected user does not have teacher role');
    }

    const existingClasses = await this.prisma.class.findMany({
      where: {
        id: {
          in: uniqueClassIds,
        },
      },
      select: {
        id: true,
      },
    });

    const existingClassIds = new Set(
      existingClasses.map((classItem) => classItem.id),
    );

    const missingClassIds = uniqueClassIds.filter(
      (classId) => !existingClassIds.has(classId),
    );

    if (missingClassIds.length > 0) {
      throw new NotFoundException(
        `Classes are not found: ${missingClassIds.join(', ')}`,
      );
    }

    return this.prisma.$transaction(
      uniqueClassIds.map((classId) =>
        this.prisma.class.update({
          where: {
            id: classId,
          },
          data: {
            teachers: {
              connect: {
                id: teacherId,
              },
            },
          },
          include: {
            teachers: true,
            students: true,
            createdBy: true,
          },
        }),
      ),
    );
  }

  private async validateClassMembers(
    classId: number,
    userIds: number[],
    expectedRole: 'teacher' | 'student',
    action: 'add' | 'remove',
  ): Promise<number[]> {
    const uniqueUserIds = [...new Set(userIds)];

    if (uniqueUserIds.length === 0) {
      throw new BadRequestException('At least one user ID is required');
    }

    const classItem = await this.prisma.class.findUnique({
      where: {
        id: classId,
      },
      select: {
        id: true,
        teachers: {
          select: {
            id: true,
          },
        },
        students: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!classItem) {
      throw new NotFoundException('Class is not found');
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: uniqueUserIds,
        },
      },
      include: {
        role: true,
      },
    });

    const existingUserIds = new Set(users.map((user) => user.id));

    const missingUserIds = uniqueUserIds.filter(
      (userId) => !existingUserIds.has(userId),
    );

    if (missingUserIds.length > 0) {
      throw new NotFoundException(
        `Users are not found: ${missingUserIds.join(', ')}`,
      );
    }

    const invalidUsers = users.filter(
      (user) => user.role.name.toLowerCase() !== expectedRole,
    );

    if (invalidUsers.length > 0) {
      throw new BadRequestException(
        `These users do not have ${expectedRole} role: ${invalidUsers
          .map((user) => user.id)
          .join(', ')}`,
      );
    }

    const currentMemberIds = new Set(
      expectedRole === 'teacher'
        ? classItem.teachers.map((teacher) => teacher.id)
        : classItem.students.map((student) => student.id),
    );

    if (action === 'add') {
      const duplicatedUserIds = uniqueUserIds.filter((userId) =>
        currentMemberIds.has(userId),
      );

      if (duplicatedUserIds.length > 0) {
        throw new BadRequestException(
          `These ${expectedRole}s already exist in class: ${duplicatedUserIds.join(
            ', ',
          )}`,
        );
      }
    }

    if (action === 'remove') {
      const notInClassUserIds = uniqueUserIds.filter(
        (userId) => !currentMemberIds.has(userId),
      );

      if (notInClassUserIds.length > 0) {
        throw new BadRequestException(
          `These ${expectedRole}s are not in class: ${notInClassUserIds.join(
            ', ',
          )}`,
        );
      }
    }

    return uniqueUserIds;
  }

  async addTeachersToClass(classId: number, teacherIds: number[]) {
    const validTeacherIds = await this.validateClassMembers(
      classId,
      teacherIds,
      'teacher',
      'add',
    );

    return this.prisma.class.update({
      where: {
        id: classId,
      },
      data: {
        teachers: {
          connect: validTeacherIds.map((id) => ({
            id,
          })),
        },
      },
      include: {
        teachers: true,
        students: true,
        createdBy: true,
      },
    });
  }

  async addStudentsToClass(classId: number, studentIds: number[]) {
    const validStudentIds = await this.validateClassMembers(
      classId,
      studentIds,
      'student',
      'add',
    );

    const updatedClass = await this.prisma.class.update({
      where: {
        id: classId,
      },
      data: {
        students: {
          connect: validStudentIds.map((id) => ({
            id,
          })),
        },
      },
      include: {
        teachers: true,
        students: true,
        createdBy: true,
      },
    });

    await this.notificationsService.createMany(
      validStudentIds,
      'enrollment',
      `You have been enrolled in ${updatedClass.name}`,
      undefined,
      `/classes/${classId}`,
    );

    return updatedClass;
  }

  async removeTeachersFromClass(classId: number, teacherIds: number[]) {
    const validTeacherIds = await this.validateClassMembers(
      classId,
      teacherIds,
      'teacher',
      'remove',
    );

    return this.prisma.class.update({
      where: {
        id: classId,
      },
      data: {
        teachers: {
          disconnect: validTeacherIds.map((id) => ({
            id,
          })),
        },
      },
      include: {
        teachers: true,
        students: true,
        createdBy: true,
      },
    });
  }

  async removeStudentsFromClass(classId: number, studentIds: number[]) {
    const validStudentIds = await this.validateClassMembers(
      classId,
      studentIds,
      'student',
      'remove',
    );

    return this.prisma.class.update({
      where: {
        id: classId,
      },
      data: {
        students: {
          disconnect: validStudentIds.map((id) => ({
            id,
          })),
        },
      },
      include: {
        teachers: true,
        students: true,
        createdBy: true,
      },
    });
  }

  async getTeachersByClassId(classId: number) {
    const classItem = await this.prisma.class.findUnique({
      where: {
        id: classId,
      },
      select: {
        teachers: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!classItem) {
      throw new NotFoundException('Class is not found');
    }

    return classItem.teachers;
  }

  async getStudentsByClassId(classId: number) {
    const classItem = await this.prisma.class.findUnique({
      where: {
        id: classId,
      },
      select: {
        students: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!classItem) {
      throw new NotFoundException('Class is not found');
    }

    return classItem.students;
  }

  async searchStudents(input: SearchStudentsInput) {
    const name = input.name?.trim();
    const email = input.email?.trim();

    if (!name && !email) {
      throw new BadRequestException('Name or email is required');
    }

    const page = input.page ?? 1;
    const limit = input.limit ?? 10;

    // Prisma's MongoDB connector has no `mode: 'insensitive'` filter, so
    // this matches against the lowercased shadow fields kept in sync on
    // every User write (see schema.prisma's User.nameLower/emailLower).
    const searchConditions: Prisma.UserWhereInput[] = [];
    if (name) {
      searchConditions.push({
        nameLower: {
          contains: name.toLowerCase(),
        },
      });
    }

    if (email) {
      searchConditions.push({
        emailLower: {
          contains: email.toLowerCase(),
        },
      });
    }

    const where: Prisma.UserWhereInput = {
      role: {
        is: {
          name: {
            equals: 'student',
          },
        },
      },
      OR: searchConditions,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: {
          role: true,
        },
        orderBy: {
          name: 'asc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }
}
