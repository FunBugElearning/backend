import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
export class LearningReport {
  @Field(() => Int, { description: 'Learning Report Id' })
  id: number;

  @Field(() => Int, { description: 'Class Id' })
  class_id: number;

  @Field(() => Int, { description: 'Student Id' })
  student_id: number;

  @Field(() => Int, {
    nullable: true,
    description: 'Report Generator Id',
  })
  generated_by?: number;

  @Field(() => Date, { description: 'Report Period Start' })
  periodStart: Date;

  @Field(() => Date, { description: 'Report Period End' })
  periodEnd: Date;

  @Field(() => String, {
    nullable: true,
    description: 'Learning Report Summary',
  })
  summary?: string;

  @Field(() => Int, { description: 'Total Class Sessions' })
  totalSessions: number;

  @Field(() => Int, { description: 'Present Count' })
  presentCount: number;

  @Field(() => Int, { description: 'Excused Absence Count' })
  absentExcusedCount: number;

  @Field(() => Int, { description: 'Unexcused Absence Count' })
  absentUnexcusedCount: number;

  @Field(() => Int, { description: 'Late Count' })
  lateCount: number;

  @Field(() => Float, {
    nullable: true,
    description: 'Student Average Score',
  })
  averageScore?: number;

  @Field(() => GraphQLJSON, {
    nullable: true,
    description: 'Additional Learning Report Data',
  })
  reportData?: Record<string, unknown>;

  @Field(() => Date, { description: 'Report Generated At' })
  generatedAt: Date;

  @Field(() => Date, { description: 'Learning Report Created At' })
  createdAt: Date;

  @Field(() => Date, { description: 'Learning Report Updated At' })
  updatedAt: Date;
}
