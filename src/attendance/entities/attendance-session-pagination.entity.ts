import { Field, Int, ObjectType } from '@nestjs/graphql';
import { AttendanceSessionSummary } from './attendance-session-summary.entity';

@ObjectType()
export class AttendanceSessionPagination {
  @Field(() => [AttendanceSessionSummary])
  items: AttendanceSessionSummary[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}
