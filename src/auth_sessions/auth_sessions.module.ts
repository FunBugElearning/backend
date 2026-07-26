import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthSessionsService } from './auth_sessions.service';
import { AuthSessionsResolver } from './auth_sessions.resolver';

@Module({
  imports: [PrismaModule],
  providers: [AuthSessionsResolver, AuthSessionsService],
})
export class AuthSessionsModule {}
