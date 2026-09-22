import { Module } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { LessonsResolver } from './lessons.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LessonsResolver, LessonsService],
})
export class LessonsModule {}
