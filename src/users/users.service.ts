import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { PrismaService } from '../prisma/prisma.service';
import { IdSequenceService } from '../prisma/id-sequence.service';
import { logger } from 'src/helper/logger';
import { hashPassword } from 'src/utils/password.utils';

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

  remove(id: number) {
    try {
      return this.prisma.user.delete({
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
