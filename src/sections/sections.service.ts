import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { IdSequenceService } from 'src/prisma/id-sequence.service';
import { CreateSectionInput } from './dto/create-section.input';
import { UpdateSectionInput } from './dto/update-section.input';

@Injectable()
export class SectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idSequence: IdSequenceService,
  ) {}

  async create(input: CreateSectionInput, createdById: number) {
    const name = input.name.trim();

    if (!name) {
      throw new BadRequestException('Section name is required');
    }

    const classItem = await this.prisma.class.findUnique({
      where: { id: input.classId },
      select: { id: true },
    });

    if (!classItem) {
      throw new NotFoundException('Class is not found');
    }

    return this.prisma.section.create({
      data: {
        id: await this.idSequence.next('Section'),
        classId: input.classId,
        name,
        description: input.description?.trim() || undefined,
        order: input.order ?? 0,
        createdById,
      },
      include: { class: true, createdBy: true },
    });
  }

  async findByClassId(classId: number) {
    const classItem = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { id: true },
    });

    if (!classItem) {
      throw new NotFoundException('Class is not found');
    }

    const sections = await this.prisma.section.findMany({
      where: { classId },
      orderBy: { order: 'asc' },
      include: {
        class: true,
        createdBy: true,
        _count: { select: { lessons: true } },
      },
    });

    return sections.map((section) => ({
      ...section,
      lessonCount: section._count.lessons,
    }));
  }

  async findOne(id: number) {
    const section = await this.prisma.section.findUnique({
      where: { id },
      include: {
        class: true,
        createdBy: true,
        _count: { select: { lessons: true } },
      },
    });

    if (!section) {
      throw new NotFoundException('Section is not found');
    }

    return { ...section, lessonCount: section._count.lessons };
  }

  async update(input: UpdateSectionInput) {
    const section = await this.prisma.section.findUnique({
      where: { id: input.id },
      select: { id: true },
    });

    if (!section) {
      throw new NotFoundException('Section is not found');
    }

    if (input.name !== undefined && !input.name.trim()) {
      throw new BadRequestException('Section name is required');
    }

    return this.prisma.section.update({
      where: { id: input.id },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.description !== undefined && {
          description: input.description?.trim() || null,
        }),
        ...(input.order !== undefined && { order: input.order }),
      },
      include: { class: true, createdBy: true },
    });
  }

  async remove(id: number) {
    const section = await this.prisma.section.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!section) {
      throw new NotFoundException('Section is not found');
    }

    // Lesson.onDelete: Cascade handles removing this section's lessons.
    return this.prisma.section.delete({
      where: { id },
      include: { class: true, createdBy: true },
    });
  }

  /** Used by the resolver's ownership checks to resolve a section's classId. */
  async getClassIdForSection(id: number): Promise<number> {
    const section = await this.prisma.section.findUnique({
      where: { id },
      select: { classId: true },
    });

    if (!section) {
      throw new NotFoundException('Section is not found');
    }

    return section.classId;
  }
}
