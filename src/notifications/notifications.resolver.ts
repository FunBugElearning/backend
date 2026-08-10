import { Args, Context, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { NotificationPagination } from './entities/notification-pagination.entity';
import { GetNotificationsInput } from './dto/get-notifications.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { verifyAuthenticatedUser } from 'src/middleware/role-authorization.middleware';

@Resolver(() => Notification)
export class NotificationsResolver {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  private async assertAuthenticated(req: Request): Promise<number> {
    const validation = await verifyAuthenticatedUser(req, this.prisma);

    if (!validation.ok) {
      throw new UnauthorizedException(validation.message);
    }

    return validation.userId;
  }

  @Query(() => NotificationPagination, { name: 'myNotifications' })
  async findMine(
    @Context('req') req: Request,
    @Args('input', { nullable: true }) input?: GetNotificationsInput,
  ) {
    const userId = await this.assertAuthenticated(req);

    return this.notificationsService.findMine(
      userId,
      input?.page,
      input?.limit,
    );
  }

  @Query(() => Int, { name: 'unreadNotificationCount' })
  async unreadCount(@Context('req') req: Request) {
    const userId = await this.assertAuthenticated(req);

    return this.notificationsService.unreadCount(userId);
  }

  @Mutation(() => Notification)
  async markNotificationRead(
    @Args('id', { type: () => Int }) id: number,
    @Context('req') req: Request,
  ) {
    const userId = await this.assertAuthenticated(req);

    return this.notificationsService.markRead(id, userId);
  }

  @Mutation(() => Boolean)
  async markAllNotificationsRead(@Context('req') req: Request) {
    const userId = await this.assertAuthenticated(req);

    return this.notificationsService.markAllRead(userId);
  }
}
