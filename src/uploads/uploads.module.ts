import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { UploadsResolver } from './uploads.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UploadsResolver, UploadsService],
})
export class UploadsModule {}
