import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Class } from 'src/classes/entities/class.entity';
import { User } from 'src/users/entities/user.entity';
import { ClassGradeCategory } from 'src/grade-categories/entities/class-grade-category.entity';

@ObjectType()
export class Assignment {
  @Field(() => Int, {
    description: 'Assignment ID',
  })
  id: number;

  @Field(() => String, {
    description: 'Assignment title',
  })
  title: string;

  @Field(() => String, {
    nullable: true,
    description: 'Assignment description',
  })
  description?: string;

  @Field(() => Date, {
    description: 'Assignment deadline',
  })
  deadline: Date;

  @Field(() => String, {
    nullable: true,
    description: 'Assignment topic',
  })
  topic?: string;

  @Field(() => [String], {
    description: 'Attached file URLs',
  })
  attachFiles: string[];

  @Field(() => Int, {
    description: 'Class ID',
  })
  classId: number;

  @Field(() => Int, {
    nullable: true,
    description: 'Grade category ID',
  })
  categoryId?: number;

  @Field(() => Float, {
    description: 'Maximum score',
  })
  maxScore: number;

  @Field(() => Int, {
    nullable: true,
    description: 'Created by user ID',
  })
  createdById?: number;

  @Field(() => Date, {
    description: 'Created date',
  })
  createdAt: Date;

  @Field(() => Date, {
    description: 'Updated date',
  })
  updatedAt: Date;

  @Field(() => Class, {
    nullable: true,
  })
  class?: Class;

  @Field(() => ClassGradeCategory, {
    nullable: true,
  })
  category?: ClassGradeCategory;

  @Field(() => User, {
    nullable: true,
  })
  createdBy?: User;
}
