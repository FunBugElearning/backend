import { Args, Context, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { LessonsService } from './lessons.service';
import { Lesson } from './entities/lesson.entity';
import { CreateLessonInput } from './dto/create-lesson.input';
import { UpdateLessonInput } from './dto/update-lesson.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { verifyAuthenticatedUser } from '../middleware/role-authorization.middleware';

@Resolver(() => Lesson)
export class LessonsResolver {
  constructor(
    private readonly lessonsService: LessonsService,
    private readonly prisma: PrismaService,
  ) {}

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
        'Teacher can only manage lessons for classes they teach',
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
        'You must belong to this class to view its lessons',
      );
    }
  }

  private async assertCanManageLesson(
    req: Request,
    lessonId: number,
  ): Promise<void> {
    const classId = await this.lessonsService.getClassIdForLesson(lessonId);
    await this.assertCanManageClass(req, classId);
  }

  @Mutation(() => Lesson)
  async createLesson(
    @Args('input') input: CreateLessonInput,
    @Context('req') req: Request,
  ) {
    const classId = await this.lessonsService.getClassIdForSection(
      input.sectionId,
    );
    const currentUserId = await this.assertCanManageClass(req, classId);
    return this.lessonsService.create(input, currentUserId);
  }

  @Query(() => [Lesson], { name: 'lessonsBySectionId' })
  async findBySectionId(
    @Args('sectionId', { type: () => Int }) sectionId: number,
    @Context('req') req: Request,
  ) {
    const classId = await this.lessonsService.getClassIdForSection(sectionId);
    await this.assertCanViewClass(req, classId);
    return this.lessonsService.findBySectionId(sectionId);
  }

  @Query(() => Lesson, { name: 'lesson' })
  async findOne(
    @Args('id', { type: () => Int }) id: number,
    @Context('req') req: Request,
  ) {
    const classId = await this.lessonsService.getClassIdForLesson(id);
    await this.assertCanViewClass(req, classId);
    return this.lessonsService.findOne(id);
  }

  @Mutation(() => Lesson)
  async updateLesson(
    @Args('input') input: UpdateLessonInput,
    @Context('req') req: Request,
  ) {
    await this.assertCanManageLesson(req, input.id);

    if (input.sectionId !== undefined) {
      // Moving a lesson to a different section - that section must also be
      // one this caller can manage (a teacher can't move a lesson into a
      // class they don't teach).
      const targetClassId = await this.lessonsService.getClassIdForSection(
        input.sectionId,
      );
      await this.assertCanManageClass(req, targetClassId);
    }

    return this.lessonsService.update(input);
  }

  @Mutation(() => Lesson)
  async removeLesson(
    @Args('id', { type: () => Int }) id: number,
    @Context('req') req: Request,
  ) {
    await this.assertCanManageLesson(req, id);
    return this.lessonsService.remove(id);
  }
}
