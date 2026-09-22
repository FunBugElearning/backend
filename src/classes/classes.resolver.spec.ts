import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ClassesResolver } from './classes.resolver';
import { ClassesService } from './classes.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { verifyAuthenticatedUser } from '../middleware/role-authorization.middleware';

jest.mock('../middleware/role-authorization.middleware', () => ({
  verifyAdminRole: jest.fn(),
  verifyAdminTeacherRole: jest.fn(),
  verifyAuthenticatedUser: jest.fn(),
}));

const mockedVerifyAuthenticatedUser = verifyAuthenticatedUser as jest.Mock;

describe('ClassesResolver', () => {
  let resolver: ClassesResolver;
  let prisma: { class: { findUnique: jest.Mock } };
  let classesService: { findOne: jest.Mock };

  beforeEach(async () => {
    prisma = { class: { findUnique: jest.fn() } };
    classesService = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesResolver,
        { provide: ClassesService, useValue: classesService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    resolver = module.get<ClassesResolver>(ClassesResolver);
    mockedVerifyAuthenticatedUser.mockReset();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('findOne (the `class` query)', () => {
    const req = {} as never;

    it('BUG-001 regression: a teacher who is not assigned to the class cannot read it (or its embedded roster)', async () => {
      mockedVerifyAuthenticatedUser.mockResolvedValue({
        ok: true,
        userId: 99,
        role: 'teacher',
      });
      // Ownership check query: this teacher is in neither teachers nor
      // students of the class.
      prisma.class.findUnique.mockResolvedValue({
        teachers: [],
        students: [],
      });

      await expect(resolver.findOne(4, req)).rejects.toBeInstanceOf(
        ForbiddenException,
      );

      expect(classesService.findOne).not.toHaveBeenCalled();
    });

    it('allows a teacher who IS assigned to the class', async () => {
      mockedVerifyAuthenticatedUser.mockResolvedValue({
        ok: true,
        userId: 5,
        role: 'teacher',
      });
      prisma.class.findUnique.mockResolvedValue({
        teachers: [{ id: 5 }],
        students: [],
      });
      classesService.findOne.mockResolvedValue({ id: 7, name: 'Real Class' });

      const result = await resolver.findOne(7, req);

      expect(result).toEqual({ id: 7, name: 'Real Class' });
    });

    it('always allows admin, regardless of membership', async () => {
      mockedVerifyAuthenticatedUser.mockResolvedValue({
        ok: true,
        userId: 1,
        role: 'admin',
      });
      prisma.class.findUnique.mockResolvedValue({
        teachers: [],
        students: [],
      });
      classesService.findOne.mockResolvedValue({ id: 4, name: 'Any Class' });

      const result = await resolver.findOne(4, req);

      expect(result).toEqual({ id: 4, name: 'Any Class' });
    });

    it('BUG-006 regression: a nonexistent class id throws a clean NotFoundException, not a raw GraphQL nullability error', async () => {
      mockedVerifyAuthenticatedUser.mockResolvedValue({
        ok: true,
        userId: 1,
        role: 'admin',
      });
      prisma.class.findUnique.mockResolvedValue(null);

      await expect(resolver.findOne(99999, req)).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(classesService.findOne).not.toHaveBeenCalled();
    });
  });
});
