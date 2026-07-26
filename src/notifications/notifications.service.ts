import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Called by other feature services (classes, assignments, submissions,
  // grades, attendance) at the point of the triggering event — no generic
  // pub/sub layer, direct calls are fine at this app's scale. See
  // .claude/DECISIONS.md.
  async create(
    userId: number,
    type: NotificationType,
    title: string,
    body?: string,
    link?: string,
  ) {
    return this.prisma.notification.create({
      data: { userId, type, title, body, link },
    });
  }

  async createMany(
    userIds: number[],
    type: NotificationType,
    title: string,
    body?: string,
    link?: string,
  ): Promise<void> {
    const uniqueUserIds = [...new Set(userIds)];

    if (uniqueUserIds.length === 0) {
      return;
    }

    await this.prisma.notification.createMany({
      data: uniqueUserIds.map((userId) => ({
        userId,
        type,
        title,
        body,
        link,
      })),
    });
  }

  async findMine(userId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async unreadCount(userId: number): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async markRead(id: number, userId: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!notification) {
      throw new NotFoundException('Notification is not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You do not own this notification');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllRead(userId: number): Promise<boolean> {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return true;
  }
}
