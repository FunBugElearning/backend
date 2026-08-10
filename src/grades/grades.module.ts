import { Module } from '@nestjs/common';

import { GradesService } from './grades.service';
import { GradesResolver } from './grades.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [GradesResolver, GradesService],
})
export class GradesModule {}
