import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { IdSequenceService } from 'src/prisma/id-sequence.service';
import { CreateLessonInput } from './dto/create-lesson.input';
import { UpdateLessonInput } from './dto/update-lesson.input';

@Injectable()
export class LessonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idSequence: IdSequenceService,
  ) {}

  async create(input: CreateLessonInput, createdById: number) {
    const title = input.title.trim();

    if (!title) {
      throw new BadRequestException('Lesson title is required');
    }

    const section = await this.prisma.section.findUnique({
      where: { id: input.sectionId },
      select: { id: true },
    });

    if (!section) {
      throw new NotFoundException('Section is not found');
    }

    return this.prisma.lesson.create({
      data: {
        id: await this.idSequence.next('Lesson'),
        sectionId: input.sectionId,
        title,
        content: input.content?.trim() || undefined,
        order: input.order ?? 0,
        createdById,
      },
      include: { section: true, createdBy: true },
    });
  }

  async findBySectionId(sectionId: number) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      select: { id: true },
    });

    if (!section) {
      throw new NotFoundException('Section is not found');
    }

    return this.prisma.lesson.findMany({
      where: { sectionId },
      orderBy: { order: 'asc' },
      include: { section: true, createdBy: true },
    });
  }

  async findOne(id: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { section: true, createdBy: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson is not found');
    }

    return lesson;
  }

  async update(input: UpdateLessonInput) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: input.id },
      select: { id: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson is not found');
    }

    if (input.title !== undefined && !input.title.trim()) {
      throw new BadRequestException('Lesson title is required');
    }

    if (input.sectionId !== undefined) {
      const targetSection = await this.prisma.section.findUnique({
        where: { id: input.sectionId },
        select: { id: true },
      });

      if (!targetSection) {
        throw new NotFoundException('Target section is not found');
      }
    }

    return this.prisma.lesson.update({
      where: { id: input.id },
      data: {
        ...(input.title !== undefined && { title: input.title.trim() }),
        ...(input.content !== undefined && {
          content: input.content?.trim() || null,
        }),
        ...(input.order !== undefined && { order: input.order }),
        ...(input.sectionId !== undefined && { sectionId: input.sectionId }),
      },
      include: { section: true, createdBy: true },
    });
  }

  async remove(id: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson is not found');
    }

    return this.prisma.lesson.delete({
      where: { id },
      include: { section: true, createdBy: true },
    });
  }

  /** Used by the resolver's ownership checks to resolve a lesson's classId. */
  async getClassIdForLesson(id: number): Promise<number> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      select: { section: { select: { classId: true } } },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson is not found');
    }

    return lesson.section.classId;
  }

  async getClassIdForSection(sectionId: number): Promise<number> {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      select: { classId: true },
    });

    if (!section) {
      throw new NotFoundException('Section is not found');
    }

    return section.classId;
  }
}
