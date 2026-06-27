import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StudentGrade {
  @Field(() => Int, { description: 'Student Grade Id' })
  id: number;

  @Field(() => Int, { description: 'Grade Item Id' })
  grade_item_id: number;

  @Field(() => Int, { description: 'Student Id' })
  student_id: number;

  @Field(() => Int, {
    nullable: true,
    description: 'Grader Id',
  })
  graded_by?: number;

  @Field(() => Float, {
    nullable: true,
    description: 'Student Score',
  })
  score?: number;

  @Field(() => String, {
    nullable: true,
    description: 'Grade Feedback',
  })
  feedback?: string;

  @Field(() => Date, {
    nullable: true,
    description: 'Grade Given At',
  })
  gradedAt?: Date;

  @Field(() => Date, { description: 'Student Grade Created At' })
  createdAt: Date;

  @Field(() => Date, { description: 'Student Grade Updated At' })
  updatedAt: Date;
}
