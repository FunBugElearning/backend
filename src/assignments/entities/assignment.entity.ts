import {
  Field,
  Float,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { AssignmentStatus } from '@prisma/client';
import { Class } from 'src/classes/entities/class.entity';
import { User } from 'src/users/entities/user.entity';
import { ClassGradeCategory } from 'src/grade-categories/entities/class-grade-category.entity';

registerEnumType(AssignmentStatus, {
  name: 'AssignmentStatus',
});

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

  @Field(() => AssignmentStatus, {
    description:
      'draft: only visible to admin/teacher. published: visible to students. closed: visible but not submittable.',
  })
  status: AssignmentStatus;

  @Field(() => Boolean, {
    description: 'Whether a student may resubmit after their first submission',
  })
  allowResubmit: boolean;

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
