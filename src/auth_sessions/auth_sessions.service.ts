import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthSessionsService {
  create() {
    return 'This action adds a new authSession';
  }

  findAll() {
    return `This action returns all authSessions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} authSession`;
  }

  update(id: number) {
    return `This action updates a #${id} authSession`;
  }

  remove(id: number) {
    return `This action removes a #${id} authSession`;
  }
}
