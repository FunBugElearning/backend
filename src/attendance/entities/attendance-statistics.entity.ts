import { Field, Int, Float, ObjectType } from '@nestjs/graphql';

// attendanceRate formula (see .claude/DECISIONS.md): (present + late) / (present + late +
// absent) * 100. `excused` is reported but deliberately excluded from the denominator —
// it neither helps nor hurts the rate.
@ObjectType()
export class AttendanceStatistics {
  @Field(() => Int)
  totalSessions: number;

  @Field(() => Int)
  present: number;

  @Field(() => Int)
  absent: number;

  @Field(() => Int)
  late: number;

  @Field(() => Int)
  excused: number;

  @Field(() => Float)
  attendanceRate: number;
}

@ObjectType()
export class ClassAttendanceStatistics extends AttendanceStatistics {
  @Field(() => Int)
  classId: number;
}

@ObjectType()
export class StudentAttendanceStatistics extends AttendanceStatistics {
  @Field(() => Int)
  classId: number;

  @Field(() => Int)
  studentId: number;
}
