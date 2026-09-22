import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Class } from 'src/classes/entities/class.entity';
import { User } from 'src/users/entities/user.entity';

@ObjectType()
export class Section {
  @Field(() => Int, { description: 'Section ID' })
  id: number;

  @Field(() => Int, { description: 'Class ID' })
  classId: number;

  @Field(() => String, { description: 'Section name' })
  name: string;

  @Field(() => String, { nullable: true, description: 'Section description' })
  description?: string;

  @Field(() => Int, { description: 'Display order within the class' })
  order: number;

  @Field(() => Int, { nullable: true, description: 'Created by user ID' })
  createdById?: number;

  @Field(() => Date, { description: 'Created date' })
  createdAt: Date;

  @Field(() => Date, { description: 'Updated date' })
  updatedAt: Date;

  @Field(() => Class, { nullable: true })
  class?: Class;

  @Field(() => User, { nullable: true })
  createdBy?: User;

  @Field(() => Int, {
    nullable: true,
    description: 'Number of lessons in this section',
  })
  lessonCount?: number;
}
