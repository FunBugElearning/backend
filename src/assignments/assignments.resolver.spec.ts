import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentsResolver } from './assignments.resolver';
import { AssignmentsService } from './assignments.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('AssignmentsResolver', () => {
  let resolver: AssignmentsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsResolver,
        {
          provide: AssignmentsService,
          useValue: {},
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    resolver = module.get<AssignmentsResolver>(AssignmentsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});