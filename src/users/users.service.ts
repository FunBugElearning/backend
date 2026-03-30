import { Injectable } from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { PrismaService } from '../prisma/prisma.service';
import { logger } from 'src/helper/logger';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  create(createUserInput: CreateUserInput) {

    try {
      return this.prisma.user.create({
        data: { ...createUserInput },
      });
    } catch (error) {
      logger.error('Error creating user', { error });
      throw error;
    }

  }

  async findAll() {
    try {
      const users = await this.prisma.user.findMany();
      logger.info('Finding all users', { data: users });
      return users;
    } catch (error) {
      logger.error('Error finding all users', { error });
      throw error;
    }
  }

  findOne(id: number) {
    try {
      return this.prisma.user.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error('Error finding user', { error });
      throw error;
    }
  }

  update(id: number, updateUserInput: UpdateUserInput) {
    const { id: inputId, ...data } = updateUserInput;
    void inputId;

    try {
      return this.prisma.user.update({
        where: { id },
        data,
      });
    } catch (error) {
      logger.error('Error updating user', { error });
      throw error;
    }
  }

  remove(id: number) {
    try {
      return this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      logger.error('Error removing user', { error });
      throw error;
    }
  }
}
