import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Lesson {
  @Field(() => Int, { description: 'Lesson Id' })
  id: number;

  @Field(() => String, { description: 'Lesson Title' })
  title: string;

  @Field(() => String, {
    nullable: true,
    description: 'Lesson Description',
  })
  description?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Lesson Content',
  })
  content?: string;

  @Field(() => Int, { description: 'Lesson Position' })
  position: number;

  @Field(() => Int, { description: 'Section Id' })
  section_id: number;

  @Field(() => Date, { description: 'Lesson Created At' })
  createdAt: Date;

  @Field(() => Date, { description: 'Lesson Updated At' })
  updatedAt: Date;
}
