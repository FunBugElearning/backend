import { Args, Context, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { SectionsService } from './sections.service';
import { Section } from './entities/section.entity';
import { CreateSectionInput } from './dto/create-section.input';
import { UpdateSectionInput } from './dto/update-section.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { verifyAuthenticatedUser } from '../middleware/role-authorization.middleware';

@Resolver(() => Section)
export class SectionsResolver {
  constructor(
    private readonly sectionsService: SectionsService,
    private readonly prisma: PrismaService,
  ) {}

  // Same ownership pattern as AssignmentsResolver: admin manages every
  // class's sections, a teacher only their own, a student can read but not
  // write.

  private async assertCanManageClass(
    req: Request,
    classId: number,
  ): Promise<number> {
    const validation = await verifyAuthenticatedUser(req, this.prisma);

    if (!validation.ok) {
      throw new UnauthorizedException(validation.message);
    }

    const classItem = await this.prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        teachers: { where: { id: validation.userId }, select: { id: true } },
      },
    });

    if (!classItem) {
      throw new NotFoundException('Class is not found');
    }

    const role = validation.role.toLowerCase();

    if (role === 'admin') {
      return validation.userId;
    }

    if (role !== 'teacher') {
      throw new ForbiddenException('Admin or teacher role is required');
    }

    if (classItem.teachers.length === 0) {
      throw new ForbiddenException(
        'Teacher can only manage sections for classes they teach',
      );
    }

    return validation.userId;
  }

  private async assertCanViewClass(
    req: Request,
    classId: number,
  ): Promise<void> {
    const validation = await verifyAuthenticatedUser(req, this.prisma);

    if (!validation.ok) {
      throw new UnauthorizedException(validation.message);
    }

    const classItem = await this.prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        teachers: { where: { id: validation.userId }, select: { id: true } },
        students: { where: { id: validation.userId }, select: { id: true } },
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
        'You must belong to this class to view its sections',
      );
    }
  }

  private async assertCanManageSection(
    req: Request,
    sectionId: number,
  ): Promise<void> {
    const classId = await this.sectionsService.getClassIdForSection(sectionId);
    await this.assertCanManageClass(req, classId);
  }

  @Mutation(() => Section)
  async createSection(
    @Args('input') input: CreateSectionInput,
    @Context('req') req: Request,
  ) {
    const currentUserId = await this.assertCanManageClass(req, input.classId);
    return this.sectionsService.create(input, currentUserId);
  }

  @Query(() => [Section], { name: 'sectionsByClassId' })
  async findByClassId(
    @Args('classId', { type: () => Int }) classId: number,
    @Context('req') req: Request,
  ) {
    await this.assertCanViewClass(req, classId);
    return this.sectionsService.findByClassId(classId);
  }

  @Query(() => Section, { name: 'section' })
  async findOne(
    @Args('id', { type: () => Int }) id: number,
    @Context('req') req: Request,
  ) {
    const classId = await this.sectionsService.getClassIdForSection(id);
    await this.assertCanViewClass(req, classId);
    return this.sectionsService.findOne(id);
  }

  @Mutation(() => Section)
  async updateSection(
    @Args('input') input: UpdateSectionInput,
    @Context('req') req: Request,
  ) {
    await this.assertCanManageSection(req, input.id);
    return this.sectionsService.update(input);
  }

  @Mutation(() => Section)
  async removeSection(
    @Args('id', { type: () => Int }) id: number,
    @Context('req') req: Request,
  ) {
    await this.assertCanManageSection(req, id);
    return this.sectionsService.remove(id);
  }
}
