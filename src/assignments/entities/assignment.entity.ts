import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Assignment {
  @Field(() => Int, { description: 'Assignment Id' })
  id: number;

  @Field(() => Int, { description: 'Section Id' })
  section_id: number;

  @Field(() => Int, { description: 'Assignment Creator Id' })
  created_by: number;

  @Field(() => String, { description: 'Assignment Title' })
  title: string;

  @Field(() => String, {
    nullable: true,
    description: 'Assignment Description',
  })
  description?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Assignment Instructions',
  })
  instructions?: string;

  @Field(() => Date, {
    nullable: true,
    description: 'Assignment Due Date',
  })
  dueDate?: Date;

  @Field(() => Float, { description: 'Assignment Maximum Score' })
  maxScore: number;

  @Field(() => Boolean, { description: 'Assignment Published Status' })
  isPublished: boolean;

  @Field(() => Date, { description: 'Assignment Created At' })
  createdAt: Date;

  @Field(() => Date, { description: 'Assignment Updated At' })
  updatedAt: Date;
}
