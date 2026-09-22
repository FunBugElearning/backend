import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { SectionsResolver } from './sections.resolver';
import { SectionsService } from './sections.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { verifyAuthenticatedUser } from '../middleware/role-authorization.middleware';

jest.mock('../middleware/role-authorization.middleware', () => ({
  verifyAuthenticatedUser: jest.fn(),
}));

const mockedVerifyAuthenticatedUser = verifyAuthenticatedUser as jest.Mock;

describe('SectionsResolver', () => {
  let resolver: SectionsResolver;
  let prisma: { class: { findUnique: jest.Mock } };
  let sectionsService: { create: jest.Mock };

  beforeEach(async () => {
    prisma = { class: { findUnique: jest.fn() } };
    sectionsService = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SectionsResolver,
        { provide: SectionsService, useValue: sectionsService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    resolver = module.get<SectionsResolver>(SectionsResolver);
    mockedVerifyAuthenticatedUser.mockReset();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createSection', () => {
    it('rejects a teacher who does not teach the target class', async () => {
      mockedVerifyAuthenticatedUser.mockResolvedValue({
        ok: true,
        userId: 42,
        role: 'teacher',
      });
      prisma.class.findUnique.mockResolvedValue({ id: 7, teachers: [] });

      await expect(
        resolver.createSection(
          { classId: 7, name: 'Week 1' } as never,
          {} as never,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(sectionsService.create).not.toHaveBeenCalled();
    });

    it('allows a teacher who does teach the target class', async () => {
      mockedVerifyAuthenticatedUser.mockResolvedValue({
        ok: true,
        userId: 42,
        role: 'teacher',
      });
      prisma.class.findUnique.mockResolvedValue({
        id: 7,
        teachers: [{ id: 42 }],
      });
      sectionsService.create.mockResolvedValue({ id: 1, name: 'Week 1' });

      const result = await resolver.createSection(
        { classId: 7, name: 'Week 1' } as never,
        {} as never,
      );

      expect(result).toEqual({ id: 1, name: 'Week 1' });
      expect(sectionsService.create).toHaveBeenCalledWith(
        { classId: 7, name: 'Week 1' },
        42,
      );
    });
  });
});
