import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';

describe('ClassesService', () => {
  let service: ClassesService;
  let prisma: {
    class: { findUnique: jest.Mock; update: jest.Mock };
    user: { findMany: jest.Mock };
  };
  let notificationsService: { createMany: jest.Mock };

  beforeEach(async () => {
    prisma = {
      class: { findUnique: jest.fn(), update: jest.fn() },
      user: { findMany: jest.fn() },
    };
    notificationsService = { createMany: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<ClassesService>(ClassesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addStudentsToClass', () => {
    it('rejects an empty student ID list', async () => {
      await expect(service.addStudentsToClass(1, [])).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects when the class does not exist', async () => {
      prisma.class.findUnique.mockResolvedValue(null);

      await expect(service.addStudentsToClass(999, [5])).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects a user who does not have the student role', async () => {
      prisma.class.findUnique.mockResolvedValue({
        id: 1,
        teachers: [],
        students: [],
      });
      prisma.user.findMany.mockResolvedValue([
        { id: 5, role: { name: 'teacher' } },
      ]);

      await expect(service.addStudentsToClass(1, [5])).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects a student who is already enrolled', async () => {
      prisma.class.findUnique.mockResolvedValue({
        id: 1,
        teachers: [],
        students: [{ id: 5 }],
      });
      prisma.user.findMany.mockResolvedValue([
        { id: 5, role: { name: 'student' } },
      ]);

      await expect(service.addStudentsToClass(1, [5])).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('enrolls valid students and notifies exactly the newly-added ones', async () => {
      prisma.class.findUnique.mockResolvedValue({
        id: 1,
        teachers: [],
        students: [],
      });
      prisma.user.findMany.mockResolvedValue([
        { id: 5, role: { name: 'student' } },
      ]);
      prisma.class.update.mockResolvedValue({
        id: 1,
        name: 'Math 101',
        teachers: [],
        students: [{ id: 5 }],
      });

      await service.addStudentsToClass(1, [5]);

      expect(notificationsService.createMany).toHaveBeenCalledWith(
        [5],
        'enrollment',
        'You have been enrolled in Math 101',
        undefined,
        '/classes/1',
      );
    });
  });

  describe('searchStudents', () => {
    it('rejects a search with neither name nor email', async () => {
      await expect(service.searchStudents({})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
