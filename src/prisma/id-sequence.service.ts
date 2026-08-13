import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// MongoDB's _id has no native autoincrement, so every model that used to
// rely on Postgres's SERIAL keeps an application-assigned Int id instead of
// switching to ObjectId - that's what lets the GraphQL contract (Int ids
// everywhere) and the frontend stay unchanged. Each entry below gets its own
// Counter document, incremented atomically via MongoDB's $inc.
const SEQUENCE_MODELS = [
  'User',
  'Role',
  'AuthSession',
  'AuthAuditLog',
  'Class',
  'Assignment',
  'AttendanceSession',
  'AttendanceRecord',
  'ClassGradeCategory',
  'Submission',
  'Grade',
  'Notification',
] as const;

export type SequenceModel = (typeof SEQUENCE_MODELS)[number];

@Injectable()
export class IdSequenceService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await Promise.all(
      SEQUENCE_MODELS.map((model) =>
        this.prisma.counter.upsert({
          where: { id: model },
          update: {},
          create: { id: model, seq: 0 },
        }),
      ),
    );
  }

  async next(model: SequenceModel): Promise<number> {
    const counter = await this.prisma.counter.update({
      where: { id: model },
      data: { seq: { increment: 1 } },
    });

    return counter.seq;
  }
}
