import { Module } from '@nestjs/common';

import { AttendanceService } from './attendance.service';
import { AttendanceResolver } from './attendance.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    AttendanceResolver,
    AttendanceService,
  ],
})
export class AttendanceModule {}