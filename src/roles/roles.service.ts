import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdSequenceService } from '../prisma/id-sequence.service';
import { CreateRoleInput } from './dto/create-role.input';
import { UpdateRoleInput } from './dto/update-role.input';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idSequence: IdSequenceService,
  ) {}

  async create(createRoleInput: CreateRoleInput) {
    const name = createRoleInput.name.trim().toLowerCase();
    const description = createRoleInput.description?.trim() || undefined;

    return this.prisma.role.create({
      data: {
        id: await this.idSequence.next('Role'),
        name,
        description,
      },
    });
  }

  findAll() {
    return this.prisma.role.findMany({
      orderBy: { id: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.role.findUniqueOrThrow({
      where: { id },
    });
  }

  update(id: number, updateRoleInput: UpdateRoleInput) {
    const { id: inputId, ...data } = updateRoleInput;
    void inputId;

    return this.prisma.role.update({
      where: { id },
      data: {
        ...data,
        name: data.name?.trim().toLowerCase(),
        description:
          data.description === undefined
            ? undefined
            : data.description.trim() || null,
      },
    });
  }

  remove(id: number) {
    return this.prisma.role.delete({
      where: { id },
    });
  }
}
