import { Test, TestingModule } from '@nestjs/testing';
import { AuthSessionsService } from './auth_sessions.service';

describe('AuthSessionsService', () => {
  let service: AuthSessionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthSessionsService],
    }).compile();

    service = module.get<AuthSessionsService>(AuthSessionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
