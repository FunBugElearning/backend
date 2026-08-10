import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { RecentSubmissionActivity } from './dashboard-shared.entity';

@ObjectType()
export class AdminDashboard {
  @Field(() => Int) totalClasses: number;
  @Field(() => Int) totalTeachers: number;
  @Field(() => Int) totalStudents: number;
  @Field(() => Int) totalAssignments: number;
  @Field(() => Float) submissionCompletionRate: number;
  @Field(() => Float) attendanceRate: number;
  @Field(() => [RecentSubmissionActivity])
  recentActivity: RecentSubmissionActivity[];
}
