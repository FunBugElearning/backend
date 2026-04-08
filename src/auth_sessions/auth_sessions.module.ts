import { Module } from '@nestjs/common';
import { AuthSessionsService } from './auth_sessions.service';
import { AuthSessionsResolver } from './auth_sessions.resolver';

@Module({
  providers: [AuthSessionsResolver, AuthSessionsService],
})
export class AuthSessionsModule {}
