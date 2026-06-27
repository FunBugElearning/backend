import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { RolesService } from './roles.service';

describe('RolesService', () => {
  let service: RolesService;
  let prisma: {
    role: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      role: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a role', async () => {
    const result = {
      id: 4,
      name: 'moderator',
      description: 'Test role',
    };

    prisma.role.create.mockResolvedValue(result);

    await expect(
      service.create({
        name: ' Moderator ',
        description: ' Test role ',
      }),
    ).resolves.toEqual(result);

    expect(prisma.role.create).toHaveBeenCalledWith({
      data: {
        name: 'moderator',
        description: 'Test role',
      },
    });
  });

  it('should return all roles', async () => {
    const roles = [
      { id: 1, name: 'admin', description: 'Administrator role' },
      { id: 2, name: 'teacher', description: 'Teacher role' },
    ];

    prisma.role.findMany.mockResolvedValue(roles);

    await expect(service.findAll()).resolves.toEqual(roles);

    expect(prisma.role.findMany).toHaveBeenCalledWith({
      orderBy: { id: 'asc' },
    });
  });

  it('should return one role', async () => {
    const role = {
      id: 1,
      name: 'admin',
      description: 'Administrator role',
    };

    prisma.role.findUniqueOrThrow.mockResolvedValue(role);

    await expect(service.findOne(1)).resolves.toEqual(role);

    expect(prisma.role.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it('should update a role', async () => {
    const updatedRole = {
      id: 4,
      name: 'content moderator',
      description: 'Updated role',
    };

    prisma.role.update.mockResolvedValue(updatedRole);

    await expect(
      service.update(4, {
        id: 4,
        name: ' Content Moderator ',
        description: ' Updated role ',
      }),
    ).resolves.toEqual(updatedRole);

    expect(prisma.role.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: {
        name: 'content moderator',
        description: 'Updated role',
      },
    });
  });

  it('should remove a role', async () => {
    const deletedRole = {
      id: 4,
      name: 'content moderator',
      description: 'Updated role',
    };

    prisma.role.delete.mockResolvedValue(deletedRole);

    await expect(service.remove(4)).resolves.toEqual(deletedRole);

    expect(prisma.role.delete).toHaveBeenCalledWith({
      where: { id: 4 },
    });
  });
});
