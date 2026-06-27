import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GradeItem {
  @Field(() => Int, { description: 'Grade Item Id' })
  id: number;

  @Field(() => Int, { description: 'Class Id' })
  class_id: number;

  @Field(() => Int, { description: 'Grade Item Creator Id' })
  created_by: number;

  @Field(() => String, { description: 'Grade Item Name' })
  name: string;

  @Field(() => String, {
    nullable: true,
    description: 'Grade Item Description',
  })
  description?: string;

  @Field(() => Float, { description: 'Grade Item Maximum Score' })
  maxScore: number;

  @Field(() => Float, {
    nullable: true,
    description: 'Grade Item Weight',
  })
  weight?: number;

  @Field(() => Date, {
    nullable: true,
    description: 'Grade Item Due Date',
  })
  dueDate?: Date;

  @Field(() => Date, { description: 'Grade Item Created At' })
  createdAt: Date;

  @Field(() => Date, { description: 'Grade Item Updated At' })
  updatedAt: Date;
}
