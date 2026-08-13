import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    if (!process.env.DATABASE_URL) {
      try {
        process.loadEnvFile();
      } catch {
        // Ignore and fall through to explicit DATABASE_URL error below.
      }
    }

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set');
    }

    super();
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
