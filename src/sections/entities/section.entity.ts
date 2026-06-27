import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Section {
  @Field(() => Int, { description: 'Section Id' })
  id: number;

  @Field(() => String, { description: 'Section Name' })
  name: string;

  @Field(() => String, {
    nullable: true,
    description: 'Section Description',
  })
  description?: string;

  @Field(() => Int, { description: 'Section Position' })
  position: number;

  @Field(() => Int, { description: 'Class Id' })
  class_id: number;

  @Field(() => Date, { description: 'Section Created At' })
  createdAt: Date;

  @Field(() => Date, { description: 'Section Updated At' })
  updatedAt: Date;
}
