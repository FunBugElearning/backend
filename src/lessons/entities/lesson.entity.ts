import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Section } from 'src/sections/entities/section.entity';
import { User } from 'src/users/entities/user.entity';

@ObjectType()
export class Lesson {
  @Field(() => Int, { description: 'Lesson ID' })
  id: number;

  @Field(() => Int, { description: 'Section ID' })
  sectionId: number;

  @Field(() => String, { description: 'Lesson title' })
  title: string;

  @Field(() => String, { nullable: true, description: 'Lesson content' })
  content?: string;

  @Field(() => Int, { description: 'Display order within the section' })
  order: number;

  @Field(() => Int, { nullable: true, description: 'Created by user ID' })
  createdById?: number;

  @Field(() => Date, { description: 'Created date' })
  createdAt: Date;

  @Field(() => Date, { description: 'Updated date' })
  updatedAt: Date;

  @Field(() => Section, { nullable: true })
  section?: Section;

  @Field(() => User, { nullable: true })
  createdBy?: User;
}
