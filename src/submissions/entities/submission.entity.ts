import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Assignment } from 'src/assignments/entities/assignment.entity';
import { User } from 'src/users/entities/user.entity';
import { Grade } from 'src/grades/entities/grade.entity';

export enum SubmissionStatus {
  submitted = 'submitted',
  late = 'late',
  graded = 'graded',
}

registerEnumType(SubmissionStatus, {
  name: 'SubmissionStatus',
});

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

  @Field(() => SubmissionStatus, {
    description:
      'Server-derived: graded (has a Grade), late (submitted after the deadline), or submitted',
  })
  status: SubmissionStatus;

  @Field(() => Assignment, {
    nullable: true,
  })
  assignment?: Assignment;

  @Field(() => User, {
    nullable: true,
  })
  student?: User;

  @Field(() => Grade, {
    nullable: true,
  })
  grade?: Grade;
}
