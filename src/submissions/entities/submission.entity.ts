import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Assignment } from 'src/assignments/entities/assignment.entity';
import { User } from 'src/users/entities/user.entity';

@ObjectType()
export class Submission {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  assignmentId: number;

  @Field(() => Int)
  studentId: number;

  @Field(() => String, {
    nullable: true,
  })
  content?: string;

  @Field(() => [String])
  attachFiles: string[];

  @Field(() => Date)
  submittedAt: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => Assignment, {
    nullable: true,
  })
  assignment?: Assignment;

  @Field(() => User, {
    nullable: true,
  })
  student?: User;
}
