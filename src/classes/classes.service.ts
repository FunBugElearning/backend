import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClassInput } from './dto/create-class.input';
import { UpdateClassInput } from './dto/update-class.input';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  create(createClassInput: CreateClassInput) {
    const { name, description, teacherIds, studentIds } = createClassInput;

    return this.prisma.class.create({
      data: {
        name,
        description,
        teachers: {
          connect: teacherIds?.map((id) => ({ id })) || [],
        },
        students: {
          connect: studentIds?.map((id) => ({ id })) || [],
        },
      },
      include: {
        teachers: true,
        students: true,
      },
    });
  }

  findAll() {
    return this.prisma.class.findMany({
      include: {
        teachers: true,
        students: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.class.findUnique({
      where: { id },
      include: {
        teachers: true,
        students: true,
      },
    });
  }

  async findByUserId(userId: number) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
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
    },
  });
}

  update(id: number, updateClassInput: UpdateClassInput) {
    const { name, description, teacherIds, studentIds } = updateClassInput;

    return this.prisma.class.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(teacherIds !== undefined && {
          teachers: {
            set: teacherIds?.map((id) => ({ id })) || [],
          },
        }),
        ...(studentIds !== undefined && {
          students: {
            set: studentIds?.map((id) => ({ id })) || [],
          },
        }),
      },
      include: {
        teachers: true,
        students: true,
      },
    });
  }

  remove(id: number) {
    return this.prisma.class.delete({
      where: { id },
    });
  }
}
