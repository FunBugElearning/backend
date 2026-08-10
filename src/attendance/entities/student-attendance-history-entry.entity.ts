import { Field, Int, ObjectType } from '@nestjs/graphql';
import { AttendanceStatus } from '@prisma/client';

@ObjectType()
export class StudentAttendanceHistoryEntry {
  @Field(() => Int)
  sessionId: number;

  @Field(() => Date)
  attendanceDate: Date;

  @Field(() => String, { nullable: true })
  title?: string | null;

  @Field(() => AttendanceStatus, {
    nullable: true,
    description: 'null if not yet marked',
  })
  status?: AttendanceStatus | null;

  @Field(() => String, { nullable: true })
  note?: string | null;
}
