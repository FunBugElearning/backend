import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AttendanceStatusCount {
  @Field(() => Int)
  present: number;

  @Field(() => Int)
  absent: number;

  @Field(() => Int)
  late: number;

  @Field(() => Int)
  excused: number;
}
