import { Module } from '@nestjs/common';

import { GradesService } from './grades.service';
import { GradesResolver } from './grades.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [GradesResolver, GradesService],
})
export class GradesModule {}
