import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ClassSession {
  @Field(() => Int, { description: 'Class Session Id' })
  id: number;

  @Field(() => Int, { description: 'Class Id' })
  class_id: number;

  @Field(() => Int, {
    nullable: true,
    description: 'Lesson Id',
  })
  lesson_id?: number;

  @Field(() => Date, { description: 'Session Date' })
  sessionDate: Date;

  @Field(() => Date, {
    nullable: true,
    description: 'Session Start Time',
  })
  startTime?: Date;

  @Field(() => Date, {
    nullable: true,
    description: 'Session End Time',
  })
  endTime?: Date;

  @Field(() => String, {
    nullable: true,
    description: 'Session Note',
  })
  note?: string;

  @Field(() => Date, { description: 'Class Session Created At' })
  createdAt: Date;

  @Field(() => Date, { description: 'Class Session Updated At' })
  updatedAt: Date;
}
