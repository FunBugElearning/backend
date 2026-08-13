import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { IdSequenceService } from 'src/prisma/id-sequence.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: {
    notification: {
      create: jest.Mock;
      createMany: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let idSequence: { next: jest.Mock };

  beforeEach(async () => {
    prisma = {
      notification: {
        create: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    };
    let nextId = 100;
    idSequence = { next: jest.fn(() => Promise.resolve(++nextId)) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: IdSequenceService, useValue: idSequence },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMany', () => {
    it('dedupes recipient user IDs before writing', async () => {
      await service.createMany([5, 5, 6], 'enrollment', 'You were enrolled');

      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          {
            id: 101,
            userId: 5,
            type: 'enrollment',
            title: 'You were enrolled',
            body: undefined,
            link: undefined,
          },
          {
            id: 102,
            userId: 6,
            type: 'enrollment',
            title: 'You were enrolled',
            body: undefined,
            link: undefined,
          },
        ],
      });
    });

    it('is a no-op for an empty recipient list', async () => {
      await service.createMany([], 'enrollment', 'You were enrolled');

      expect(prisma.notification.createMany).not.toHaveBeenCalled();
    });
  });

  describe('markRead', () => {
    it('throws when the notification does not exist', async () => {
      prisma.notification.findUnique.mockResolvedValue(null);

      await expect(service.markRead(999, 5)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects marking a notification that belongs to a different user', async () => {
      prisma.notification.findUnique.mockResolvedValue({ id: 1, userId: 5 });

      await expect(service.markRead(1, 6)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });

    it("marks the caller's own notification as read", async () => {
      prisma.notification.findUnique.mockResolvedValue({ id: 1, userId: 5 });
      prisma.notification.update.mockResolvedValue({
        id: 1,
        userId: 5,
        read: true,
      });

      const result = await service.markRead(1, 5);

      expect(result.read).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { read: true },
      });
    });
  });

  describe('unreadCount', () => {
    it('scopes the count to the caller only', async () => {
      prisma.notification.count.mockResolvedValue(3);

      const result = await service.unreadCount(5);

      expect(result).toBe(3);
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 5, read: false },
      });
    });
  });
});
