import { Module } from '@nestjs/common';

import { SubmissionsService } from './submissions.service';
import { SubmissionsResolver } from './submissions.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [SubmissionsResolver, SubmissionsService],
})
export class SubmissionsModule {}
