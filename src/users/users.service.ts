import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { GetUsersInput } from './dto/get-users.input';
import { PrismaService } from '../prisma/prisma.service';
import { IdSequenceService } from '../prisma/id-sequence.service';
import { logger } from '../helper/logger';
import { hashPassword } from '../utils/password.utils';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idSequence: IdSequenceService,
  ) {}

  async create(createUserInput: CreateUserInput) {
    try {
      const { role_id, ...data } = createUserInput;
      const resolvedRoleId = await this.resolveRoleId(role_id);

      const existingUser = await this.prisma.user.findUnique({
        where: { email: createUserInput.email },
      });

      if (existingUser) {
        throw new ServiceUnavailableException('Email is already in use');
      }

      const hashedPassword = await hashPassword(createUserInput.password);

      return this.prisma.user.create({
        data: {
          id: await this.idSequence.next('User'),
          ...data,
          nameLower: data.name.toLowerCase(),
          emailLower: data.email.toLowerCase(),
          password: hashedPassword,
          role: { connect: { id: resolvedRoleId } },
        },
        include: { role: true },
      });
    } catch (error) {
      this.handleServiceError('Error creating user', error);
    }
  }

  // Convenience wrappers around `create` for the admin "create teacher"/
  // "create student" workflows: the role is fixed by which mutation is
  // called, not by any role_id the client sends, so the frontend doesn't
  // need to look up role IDs first.
  async createTeacher(createUserInput: CreateUserInput) {
    return this.createWithRoleName(createUserInput, 'teacher');
  }

  async createStudent(createUserInput: CreateUserInput) {
    return this.createWithRoleName(createUserInput, 'student');
  }

  private async createWithRoleName(
    createUserInput: CreateUserInput,
    roleName: 'teacher' | 'student',
  ) {
    try {
      const { role_id, ...data } = createUserInput;
      void role_id;

      const resolvedRoleId = await this.resolveRoleIdByName(roleName);

      const existingUser = await this.prisma.user.findUnique({
        where: { email: createUserInput.email },
      });

      if (existingUser) {
        throw new ServiceUnavailableException('Email is already in use');
      }

      const hashedPassword = await hashPassword(createUserInput.password);

      return this.prisma.user.create({
        data: {
          id: await this.idSequence.next('User'),
          ...data,
          nameLower: data.name.toLowerCase(),
          emailLower: data.email.toLowerCase(),
          password: hashedPassword,
          role: { connect: { id: resolvedRoleId } },
        },
        include: { role: true },
      });
    } catch (error) {
      this.handleServiceError(`Error creating ${roleName}`, error);
    }
  }

  async findAll() {
    try {
      const users = await this.prisma.user.findMany({
        include: { role: true },
      });
      logger.info('Finding all users', { data: users });
      return users;
    } catch (error) {
      this.handleServiceError('Error finding all users', error);
    }
  }

  // Paginated, searchable, filterable listing for the admin Students/
  // Teachers screens - `findAll` above stays as-is since it may have other
  // callers and returns a plain unpaginated array.
  async findAllPaginated(input: GetUsersInput) {
    try {
      const page = input.page ?? 1;
      const limit = input.limit ?? 10;
      const search = input.search?.trim();

      // Composed with AND (rather than spreading each into one object) so a
      // search's OR clause can never accidentally clobber the classId
      // filter's own OR clause when both are supplied at once.
      const conditions: Prisma.UserWhereInput[] = [];

      if (input.roleName) {
        conditions.push({ role: { is: { name: input.roleName } } });
      }

      if (search) {
        conditions.push({
          OR: [
            { nameLower: { contains: search.toLowerCase() } },
            { emailLower: { contains: search.toLowerCase() } },
          ],
        });
      }

      if (input.classId !== undefined) {
        if (input.roleName === 'teacher') {
          conditions.push({
            classesAsTeacherIds: { has: input.classId },
          });
        } else if (input.roleName === 'student') {
          conditions.push({
            classesAsStudentIds: { has: input.classId },
          });
        } else {
          conditions.push({
            OR: [
              { classesAsTeacherIds: { has: input.classId } },
              { classesAsStudentIds: { has: input.classId } },
            ],
          });
        }
      }

      const where: Prisma.UserWhereInput =
        conditions.length > 0 ? { AND: conditions } : {};

      const [items, total] = await this.prisma.$transaction([
        this.prisma.user.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { nameLower: 'asc' },
          include: { role: true },
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
    } catch (error) {
      this.handleServiceError('Error finding paginated users', error);
    }
  }

  findOne(id: number) {
    try {
      return this.prisma.user.findUnique({
        where: { id },
        include: { role: true },
      });
    } catch (error) {
      this.handleServiceError('Error finding user', error);
    }
  }

  async update(id: number, updateUserInput: UpdateUserInput) {
    try {
      const { id: inputId, role_id, ...data } = updateUserInput;
      void inputId;

      const existingUser = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new NotFoundException('User is not found');
      }

      if (data.email && data.email !== existingUser.email) {
        const emailOwner = await this.prisma.user.findUnique({
          where: { email: data.email },
        });

        if (emailOwner && emailOwner.id !== id) {
          throw new ServiceUnavailableException('Email is already in use');
        }
      }

      const roleData =
        role_id === undefined
          ? undefined
          : { role: { connect: { id: await this.resolveRoleId(role_id) } } };

      if (updateUserInput.password) {
        data.password = await hashPassword(updateUserInput.password);
      }

      return this.prisma.user.update({
        where: { id },
        data: {
          ...data,
          ...(data.name !== undefined && {
            nameLower: data.name.toLowerCase(),
          }),
          ...(data.email !== undefined && {
            emailLower: data.email.toLowerCase(),
          }),
          ...(roleData ?? {}),
        },
        include: { role: true },
      });
    } catch (error) {
      this.handleServiceError('Error updating user', error);
    }
  }

  async remove(id: number) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });

      if (!user) {
        throw new NotFoundException('User is not found');
      }

      // AttendanceSession.createdBy and Grade.gradedBy are onDelete:Restrict
      // in the schema - deleting a user with that history would otherwise
      // fail with a raw Prisma constraint error. Surface a clear, actionable
      // message instead of silently losing (or being blocked by) that data.
      const [sessionsCreated, gradesGiven] = await Promise.all([
        this.prisma.attendanceSession.count({ where: { createdById: id } }),
        this.prisma.grade.count({ where: { gradedById: id } }),
      ]);

      if (sessionsCreated > 0 || gradesGiven > 0) {
        throw new ServiceUnavailableException(
          `Cannot delete this user: they created ${sessionsCreated} attendance session(s) and graded ${gradesGiven} submission(s). Reassign that activity to another teacher first.`,
        );
      }

      // Class.teacherIds/studentIds are relation arrays with no onDelete
      // cascade declared - clear this user's membership on every class
      // before deleting them, so no class is left pointing at a deleted id.
      await this.prisma.user.update({
        where: { id },
        data: {
          classesAsTeacher: { set: [] },
          classesAsStudent: { set: [] },
        },
      });

      return await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      this.handleServiceError('Error removing user', error);
    }
  }

  private async resolveRoleId(roleId?: number): Promise<number> {
    if (roleId !== undefined) {
      const role = await this.prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        throw new NotFoundException('Role is not found');
      }

      return role.id;
    }

    const existingStudentRole = await this.prisma.role.findUnique({
      where: { name: 'student' },
    });

    if (existingStudentRole) {
      return existingStudentRole.id;
    }

    const studentRole = await this.prisma.role.create({
      data: {
        id: await this.idSequence.next('Role'),
        name: 'student',
        description: 'Default student role',
      },
    });

    return studentRole.id;
  }

  private async resolveRoleIdByName(
    name: 'teacher' | 'student',
  ): Promise<number> {
    const descriptions: Record<'teacher' | 'student', string> = {
      teacher: 'Teacher role',
      student: 'Default student role',
    };

    const existingRole = await this.prisma.role.findUnique({ where: { name } });

    if (existingRole) {
      return existingRole.id;
    }

    const role = await this.prisma.role.create({
      data: {
        id: await this.idSequence.next('Role'),
        name,
        description: descriptions[name],
      },
    });

    return role.id;
  }

  private handleServiceError(message: string, error: unknown): never {
    logger.error(message, { error });

    if (error instanceof NotFoundException) {
      throw error;
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P1001'
    ) {
      throw new ServiceUnavailableException('Database server is unreachable');
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2021' &&
      error.meta?.modelName === 'Role'
    ) {
      throw new ServiceUnavailableException(
        'Database schema is outdated. Run Prisma migrations.',
      );
    }

    throw error;
  }
}
