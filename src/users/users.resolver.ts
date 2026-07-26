import { Resolver, Query, Mutation, Args, Context, Int } from '@nestjs/graphql';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { PrismaService } from '../prisma/prisma.service';
import { verifyAdminRole } from '../middleware/role-authorization.middleware';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
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

  @Mutation(() => User)
  async createUser(
    @Args('createUserInput') createUserInput: CreateUserInput,
    @Context('req') req: Request,
  ) {
    await this.assertAdmin(req);
    return this.usersService.create(createUserInput);
  }

  @Mutation(() => User)
  async createTeacher(
    @Args('createUserInput') createUserInput: CreateUserInput,
    @Context('req') req: Request,
  ) {
    await this.assertAdmin(req);
    return this.usersService.createTeacher(createUserInput);
  }

  @Mutation(() => User)
  async createStudent(
    @Args('createUserInput') createUserInput: CreateUserInput,
    @Context('req') req: Request,
  ) {
    await this.assertAdmin(req);
    return this.usersService.createStudent(createUserInput);
  }

  @Query(() => [User], { name: 'users' })
  async findAll(@Context('req') req: Request) {
    await this.assertAdmin(req);
    return this.usersService.findAll();
  }

  @Query(() => User, { name: 'user' })
  async findOne(
    @Args('id', { type: () => Int }) id: number,
    @Context('req') req: Request,
  ) {
    await this.assertAdmin(req);
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  async updateUser(
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
    @Context('req') req: Request,
  ) {
    await this.assertAdmin(req);
    return this.usersService.update(updateUserInput.id, updateUserInput);
  }

  @Mutation(() => User)
  async removeUser(
    @Args('id', { type: () => Int }) id: number,
    @Context('req') req: Request,
  ) {
    await this.assertAdmin(req);
    return this.usersService.remove(id);
  }
}
