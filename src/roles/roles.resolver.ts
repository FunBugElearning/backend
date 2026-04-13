import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { Context } from '@nestjs/graphql';
import { PrismaService } from '../prisma/prisma.service';
import { verifyAdminRole } from '../middleware/role-authorization.middleware';
import { RolesService } from './roles.service';
import { Role } from './entities/role.entity';
import { CreateRoleInput } from './dto/create-role.input';
import { UpdateRoleInput } from './dto/update-role.input';

@Resolver(() => Role)
export class RolesResolver {
  constructor(
    private readonly rolesService: RolesService,
    private readonly prisma: PrismaService,
  ) {}

  private async assertAdmin(req: Request): Promise<void> {
    const validation = await verifyAdminRole(req, this.prisma);

    if (validation.ok) {
      return;
    }

    if (validation.status === 'unauthorized') {
      throw new UnauthorizedException(validation.message);
    }

    throw new ForbiddenException(validation.message);
  }

  @Mutation(() => Role)
  async createRole(
    @Args('createRoleInput') createRoleInput: CreateRoleInput,
    @Context('req') req: Request,
  ) {
    await this.assertAdmin(req);
    return this.rolesService.create(createRoleInput);
  }

  @Query(() => [Role], { name: 'roles' })
  async findAll(@Context('req') req: Request) {
    await this.assertAdmin(req);
    return this.rolesService.findAll();
  }

  @Query(() => Role, { name: 'role' })
  async findOne(
    @Args('id', { type: () => Int }) id: number,
    @Context('req') req: Request,
  ) {
    await this.assertAdmin(req);
    return this.rolesService.findOne(id);
  }

  @Mutation(() => Role)
  async updateRole(
    @Args('updateRoleInput') updateRoleInput: UpdateRoleInput,
    @Context('req') req: Request,
  ) {
    await this.assertAdmin(req);
    return this.rolesService.update(updateRoleInput.id, updateRoleInput);
  }

  @Mutation(() => Role)
  async removeRole(
    @Args('id', { type: () => Int }) id: number,
    @Context('req') req: Request,
  ) {
    await this.assertAdmin(req);
    return this.rolesService.remove(id);
  }
}
