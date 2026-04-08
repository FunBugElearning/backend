import { Injectable } from '@nestjs/common';
import { CreateAuthSessionInput } from './dto/create-auth_session.input';
import { UpdateAuthSessionInput } from './dto/update-auth_session.input';

@Injectable()
export class AuthSessionsService {
  create(createAuthSessionInput: CreateAuthSessionInput) {
    return 'This action adds a new authSession';
  }

  findAll() {
    return `This action returns all authSessions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} authSession`;
  }

  update(id: number, updateAuthSessionInput: UpdateAuthSessionInput) {
    return `This action updates a #${id} authSession`;
  }

  remove(id: number) {
    return `This action removes a #${id} authSession`;
  }
}
