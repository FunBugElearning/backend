import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IdSequenceService } from './id-sequence.service';

@Module({
  providers: [PrismaService, IdSequenceService],
  exports: [PrismaService, IdSequenceService],
})
export class PrismaModule {}
