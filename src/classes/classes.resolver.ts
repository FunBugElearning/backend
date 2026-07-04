import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { ClassesService } from './classes.service';
import { Class } from './entities/class.entity';
import { CreateClassInput } from './dto/create-class.input';
import { UpdateClassInput } from './dto/update-class.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common/exceptions/forbidden.exception';
import { UnauthorizedException } from '@nestjs/common/exceptions/unauthorized.exception';
import {
  verifyAdminTeacherRole,
  verifyAuthenticatedUser,
} from 'src/middleware/role-authorization.middleware';
import type { Request } from 'express';

@Resolver(() => Class)
export class ClassesResolver {
  constructor(
    private readonly classesService: ClassesService,
    private readonly prisma: PrismaService,
  ) {}

  private async assertAdminTeacher(req: Request): Promise<void> {
    const validation = await verifyAdminTeacherRole(req, this.prisma);

    if (validation.ok) {
      return;
    }

    if (validation.status === 'unauthorized') {
      throw new UnauthorizedException(validation.message);
    }

    throw new ForbiddenException(validation.message);
  }

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

  @Mutation(() => Class)
  async createClass(
    @Args('createClassInput') createClassInput: CreateClassInput,
    @Context('req') req: Request,
  ) {
    await this.assertAdminTeacher(req);
    return this.classesService.create(createClassInput);
  }

  @Query(() => [Class], { name: 'classes' })
  findAll() {
    return this.classesService.findAll();
  }

  @Query(() => [Class], { name: 'classesByUserId' })
async findByUserId(
  @Args('userId', { type: () => Int }) userId: number,
  @Context('req') req: Request,
) {
  await this.assertCanViewUserClasses(req, userId);

  return this.classesService.findByUserId(userId);
}

  @Query(() => Class, { name: 'class' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.classesService.findOne(id);
  }

  @Mutation(() => Class)
  updateClass(@Args('updateClassInput') updateClassInput: UpdateClassInput) {
    return this.classesService.update(updateClassInput.id, updateClassInput);
  }

  @Mutation(() => Class)
  removeClass(@Args('id', { type: () => Int }) id: number) {
    return this.classesService.remove(id);
  }
}
