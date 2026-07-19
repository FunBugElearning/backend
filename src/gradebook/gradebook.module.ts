import { Module } from '@nestjs/common';

import { GradebookService } from './gradebook.service';
import { GradebookResolver } from './gradebook.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [GradebookResolver, GradebookService],
})
export class GradebookModule {}
