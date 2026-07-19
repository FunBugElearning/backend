import { Module } from '@nestjs/common';

import { SubmissionsService } from './submissions.service';
import { SubmissionsResolver } from './submissions.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SubmissionsResolver, SubmissionsService],
})
export class SubmissionsModule {}
