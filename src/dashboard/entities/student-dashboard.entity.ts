import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import {
  DashboardAttendanceSummary,
  UpcomingAssignmentSummary,
} from './dashboard-shared.entity';
import { Notification } from 'src/notifications/entities/notification.entity';

@ObjectType()
export class StudentClassSummary {
  @Field(() => Int) classId: number;
  @Field(() => String) className: string;
  @Field(() => [String]) teacherNames: string[];
}

@ObjectType()
export class RecentGrade {
  @Field(() => Int) assignmentId: number;
  @Field(() => String) assignmentTitle: string;
  @Field(() => Int) classId: number;
  @Field(() => String) className: string;
  @Field(() => Float) score: number;
  @Field(() => Float) maxScore: number;
  @Field(() => Date) gradedAt: Date;
}

@ObjectType()
export class StudentDashboard {
  @Field(() => [StudentClassSummary]) classes: StudentClassSummary[];
  @Field(() => [UpcomingAssignmentSummary])
  upcomingAssignments: UpcomingAssignmentSummary[];
  @Field(() => [UpcomingAssignmentSummary])
  overdueAssignments: UpcomingAssignmentSummary[];
  @Field(() => [RecentGrade]) recentGrades: RecentGrade[];
  @Field(() => DashboardAttendanceSummary)
  attendance: DashboardAttendanceSummary;
  @Field(() => [Notification]) latestNotifications: Notification[];
}
