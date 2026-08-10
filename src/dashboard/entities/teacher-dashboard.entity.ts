import { Field, Int, ObjectType } from '@nestjs/graphql';
import {
  RecentSubmissionActivity,
  UpcomingAssignmentSummary,
} from './dashboard-shared.entity';

@ObjectType()
export class TeacherClassSummary {
  @Field(() => Int) classId: number;
  @Field(() => String) className: string;
  @Field(() => Int) studentCount: number;
}

@ObjectType()
export class TodayAttendanceStatus {
  @Field(() => Int) classId: number;
  @Field(() => String) className: string;
  @Field(() => Boolean) hasSessionToday: boolean;
}

@ObjectType()
export class TeacherDashboard {
  @Field(() => [TeacherClassSummary]) classes: TeacherClassSummary[];
  @Field(() => Int) totalStudents: number;
  @Field(() => Int) assignmentsAwaitingGrading: number;
  @Field(() => [RecentSubmissionActivity])
  recentSubmissions: RecentSubmissionActivity[];
  @Field(() => [UpcomingAssignmentSummary])
  upcomingDeadlines: UpcomingAssignmentSummary[];
  @Field(() => [TodayAttendanceStatus])
  todayAttendance: TodayAttendanceStatus[];
}
