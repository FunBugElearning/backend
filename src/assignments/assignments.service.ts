import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAssignmentInput } from './dto/create-assignment.input';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAssignmentInput: CreateAssignmentInput) {
    const classItem = await this.prisma.class.findUnique({
      where: {
        id: createAssignmentInput.classId,
      },
    });

    if (!classItem) {
      throw new NotFoundException('Class is not found');
    }

    return this.prisma.assignment.create({
      data: {
        title: createAssignmentInput.title,
        description: createAssignmentInput.description,
        deadline: createAssignmentInput.deadline,
        topic: createAssignmentInput.topic,
        attachFiles: createAssignmentInput.attachFiles ?? [],
        classId: createAssignmentInput.classId,
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
    });
  }

async findOne(
  id: number,
  userId: number,
  role: string,
) {
  const assignment = await this.prisma.assignment.findUnique({
    where: {
      id,
    },
  });

  if (!assignment) {
    throw new NotFoundException('Assignment is not found');
  }

  // Admin có thể xem mọi assignment
  if (role.toLowerCase() === 'admin') {
    return assignment;
  }

  // Kiểm tra user có thuộc lớp chứa assignment hay không
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
}