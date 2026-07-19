import { Module } from '@nestjs/common';

import { GradeCategoriesService } from './grade-categories.service';
import { GradeCategoriesResolver } from './grade-categories.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [GradeCategoriesResolver, GradeCategoriesService],
})
export class GradeCategoriesModule {}
