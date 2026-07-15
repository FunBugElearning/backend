import { Module } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { AssignmentsResolver } from './assignments.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AssignmentsResolver, AssignmentsService],
})
export class AssignmentsModule {}
