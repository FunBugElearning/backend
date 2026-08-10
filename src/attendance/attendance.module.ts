import { Module } from '@nestjs/common';

import { AttendanceService } from './attendance.service';
import { AttendanceResolver } from './attendance.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [AttendanceResolver, AttendanceService],
})
export class AttendanceModule {}
