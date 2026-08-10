import { Args, Context, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { ClassesService } from './classes.service';
import { Class } from './entities/class.entity';
import { ClassPagination } from './entities/class-pagination.entity';
import { StudentSearchPagination } from './entities/student-search-pagination.entity';
import { CreateClassInput } from './dto/create-class.input';
import { UpdateClassInput } from './dto/update-class.input';
import { AssignClassesToTeacherInput } from './dto/assign-classes-to-teacher.input';
import { ManageClassMembersInput } from './dto/manage-class-members.input';
import { GetClassesInput } from './dto/get-classes.input';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  verifyAdminRole,
  verifyAdminTeacherRole,
  verifyAuthenticatedUser,
} from 'src/middleware/role-authorization.middleware';
import { User } from 'src/users/entities/user.entity';
import { SearchStudentsInput } from './dto/search-students.input';

@Resolver(() => Class)
export class ClassesResolver {
  constructor(
    private readonly classesService: ClassesService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Chỉ Admin được sử dụng.
   */
  private async assertAdmin(req: Request): Promise<number> {
    const validation = await verifyAdminRole(req, this.prisma);

    if (validation.ok) {
      return validation.userId;
    }

    if (validation.status === 'unauthorized') {
      throw new UnauthorizedException(validation.message);
    }

    throw new ForbiddenException(validation.message);
  }

  /**
   * Admin hoặc Teacher được sử dụng.
   */
  private async assertAdminTeacher(req: Request): Promise<number> {
    const validation = await verifyAdminTeacherRole(req, this.prisma);

    if (validation.ok) {
      return validation.userId;
    }

    if (validation.status === 'unauthorized') {
      throw new UnauthorizedException(validation.message);
    }

    throw new ForbiddenException(validation.message);
  }

  /**
   * Admin được xem class của mọi user.
   * Teacher và Student chỉ xem class của chính mình.
   */
  private async assertCanViewUserClasses(
    req: Request,
    targetUserId: number,
  ): Promise<void> {
    const validation = await verifyAuthenticatedUser(req, this.prisma);

    if (!validation.ok) {
      throw new UnauthorizedException(validation.message);
    }

    const role = validation.role.toLowerCase();

    const isAdmin = role === 'admin';

    const isViewingOwnClasses = validation.userId === targetUserId;

    if (!isAdmin && !isViewingOwnClasses) {
      throw new ForbiddenException(
        'You do not have permission to view this user classes',
      );
    }
  }

  /**
   * Admin được quản lý mọi class.
   * Teacher chỉ quản lý class do mình tạo.
   */
  private async assertCanManageClass(
    req: Request,
    classId: number,
  ): Promise<void> {
    const validation = await verifyAuthenticatedUser(req, this.prisma);

    if (!validation.ok) {
      throw new UnauthorizedException(validation.message);
    }

    const classItem = await this.prisma.class.findUnique({
      where: {
        id: classId,
      },
      select: {
        id: true,
        createdById: true,
      },
    });

    if (!classItem) {
      throw new NotFoundException('Class is not found');
    }

    const role = validation.role.toLowerCase();

    if (role === 'admin') {
      return;
    }

    if (role !== 'teacher') {
      throw new ForbiddenException('Admin or teacher role is required');
    }

    if (classItem.createdById !== validation.userId) {
      throw new ForbiddenException(
        'Teacher can only manage classes they created',
      );
    }
  }

  /**
   * Admin được xem thành viên của mọi class.
   * Teacher hoặc Student chỉ được xem khi thuộc class đó.
   */
  private async assertCanViewClassMembers(
    req: Request,
    classId: number,
  ): Promise<void> {
    const validation = await verifyAuthenticatedUser(req, this.prisma);

    if (!validation.ok) {
      throw new UnauthorizedException(validation.message);
    }

    const classItem = await this.prisma.class.findUnique({
      where: {
        id: classId,
      },
      select: {
        teachers: {
          where: {
            id: validation.userId,
          },
          select: {
            id: true,
          },
        },
        students: {
          where: {
            id: validation.userId,
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

    const role = validation.role.toLowerCase();

    if (role === 'admin') {
      return;
    }

    const belongsToClass =
      classItem.teachers.length > 0 || classItem.students.length > 0;

    if (!belongsToClass) {
      throw new ForbiddenException(
        'You must belong to this class to view its members',
      );
    }
  }

  /**
   * Admin hoặc Teacher tạo class.
   */
  @Mutation(() => Class)
  async createClass(
    @Args('createClassInput')
    createClassInput: CreateClassInput,
    @Context('req') req: Request,
  ) {
    const currentUserId = await this.assertAdminTeacher(req);

    return this.classesService.create(createClassInput, currentUserId);
  }

  /**
   * Lấy tất cả class (phân trang). Yêu cầu đăng nhập.
   */
  @Query(() => ClassPagination, {
    name: 'classes',
  })
  async findAll(
    @Context('req') req: Request,
    @Args('input', { nullable: true }) input?: GetClassesInput,
  ) {
    const validation = await verifyAuthenticatedUser(req, this.prisma);

    if (!validation.ok) {
      throw new UnauthorizedException(validation.message);
    }

    return this.classesService.findAll(input?.page, input?.limit);
  }

  /**
   * Lấy class theo User ID.
   */
  @Query(() => [Class], {
    name: 'classesByUserId',
  })
  async findByUserId(
    @Args('userId', {
      type: () => Int,
    })
    userId: number,
    @Context('req') req: Request,
  ) {
    await this.assertCanViewUserClasses(req, userId);

    return this.classesService.findByUserId(userId);
  }

  /**
   * Lấy chi tiết class. Yêu cầu đăng nhập.
   */
  @Query(() => Class, {
    name: 'class',
  })
  async findOne(
    @Args('id', {
      type: () => Int,
    })
    id: number,
    @Context('req') req: Request,
  ) {
    const validation = await verifyAuthenticatedUser(req, this.prisma);

    if (!validation.ok) {
      throw new UnauthorizedException(validation.message);
    }

    return this.classesService.findOne(id);
  }

  /**
   * Admin sửa mọi class.
   * Teacher chỉ sửa class do mình tạo.
   */
  @Mutation(() => Class)
  async updateClass(
    @Args('updateClassInput')
    updateClassInput: UpdateClassInput,
    @Context('req') req: Request,
  ) {
    await this.assertCanManageClass(req, updateClassInput.id);

    return this.classesService.update(updateClassInput.id, updateClassInput);
  }

  /**
   * Admin xóa mọi class.
   * Teacher chỉ xóa class do mình tạo.
   */
  @Mutation(() => Class)
  async removeClass(
    @Args('id', {
      type: () => Int,
    })
    id: number,
    @Context('req') req: Request,
  ) {
    await this.assertCanManageClass(req, id);

    return this.classesService.remove(id);
  }

  /**
   * Chỉ Admin được gán nhiều class cho Teacher.
   */
  @Mutation(() => [Class])
  async assignClassesToTeacher(
    @Args('input')
    input: AssignClassesToTeacherInput,
    @Context('req') req: Request,
  ) {
    await this.assertAdmin(req);

    return this.classesService.assignClassesToTeacher(
      input.teacherId,
      input.classIds,
    );
  }

  /**
   * Admin thêm Teacher vào mọi class.
   * Teacher chỉ thêm vào class do mình tạo.
   */
  @Mutation(() => Class)
  async addTeachersToClass(
    @Args('input')
    input: ManageClassMembersInput,
    @Context('req') req: Request,
  ) {
    await this.assertCanManageClass(req, input.classId);

    return this.classesService.addTeachersToClass(input.classId, input.userIds);
  }

  /**
   * Admin thêm Student vào mọi class.
   * Teacher chỉ thêm vào class do mình tạo.
   */
  @Mutation(() => Class)
  async addStudentsToClass(
    @Args('input')
    input: ManageClassMembersInput,
    @Context('req') req: Request,
  ) {
    await this.assertCanManageClass(req, input.classId);

    return this.classesService.addStudentsToClass(input.classId, input.userIds);
  }

  /**
   * Admin xóa Teacher khỏi mọi class.
   * Teacher chỉ xóa khỏi class do mình tạo.
   */
  @Mutation(() => Class)
  async removeTeachersFromClass(
    @Args('input')
    input: ManageClassMembersInput,
    @Context('req') req: Request,
  ) {
    await this.assertCanManageClass(req, input.classId);

    return this.classesService.removeTeachersFromClass(
      input.classId,
      input.userIds,
    );
  }

  /**
   * Admin xóa Student khỏi mọi class.
   * Teacher chỉ xóa khỏi class do mình tạo.
   */
  @Mutation(() => Class)
  async removeStudentsFromClass(
    @Args('input')
    input: ManageClassMembersInput,
    @Context('req') req: Request,
  ) {
    await this.assertCanManageClass(req, input.classId);

    return this.classesService.removeStudentsFromClass(
      input.classId,
      input.userIds,
    );
  }
  /**
   * Lấy danh sách Teacher theo classId.
   * Admin xem được mọi class.
   * Teacher/Student phải thuộc class.
   */
  @Query(() => [User], {
    name: 'teachersByClassId',
  })
  async getTeachersByClassId(
    @Args('classId', {
      type: () => Int,
    })
    classId: number,
    @Context('req') req: Request,
  ) {
    await this.assertCanViewClassMembers(req, classId);

    return this.classesService.getTeachersByClassId(classId);
  }

  /**
   * Lấy danh sách Student theo classId.
   * Admin xem được mọi class.
   * Teacher/Student phải thuộc class.
   */
  @Query(() => [User], {
    name: 'studentsByClassId',
  })
  async getStudentsByClassId(
    @Args('classId', {
      type: () => Int,
    })
    classId: number,
    @Context('req') req: Request,
  ) {
    await this.assertCanViewClassMembers(req, classId);

    return this.classesService.getStudentsByClassId(classId);
  }
  /**
   * Admin hoặc Teacher tìm Student theo name hoặc email (phân trang).
   */
  @Query(() => StudentSearchPagination, {
    name: 'searchStudents',
  })
  async searchStudents(
    @Args('input')
    input: SearchStudentsInput,
    @Context('req') req: Request,
  ) {
    await this.assertAdminTeacher(req);

    return this.classesService.searchStudents(input);
  }
}
