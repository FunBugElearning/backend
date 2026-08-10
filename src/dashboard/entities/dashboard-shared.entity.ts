import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RecentSubmissionActivity {
  @Field(() => Int) submissionId: number;
  @Field(() => String) studentName: string;
  @Field(() => String) assignmentTitle: string;
  @Field(() => Int) classId: number;
  @Field(() => String) className: string;
  @Field(() => Date) submittedAt: Date;
}

@ObjectType()
export class UpcomingAssignmentSummary {
  @Field(() => Int) assignmentId: number;
  @Field(() => String) title: string;
  @Field(() => Int) classId: number;
  @Field(() => String) className: string;
  @Field(() => Date) deadline: Date;
}

@ObjectType()
export class DashboardAttendanceSummary {
  @Field(() => Int) totalSessions: number;
  @Field(() => Int) present: number;
  @Field(() => Int) absent: number;
  @Field(() => Int) late: number;
  @Field(() => Int) excused: number;
  @Field(() => Float) attendanceRate: number;
}
