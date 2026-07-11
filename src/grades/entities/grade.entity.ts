import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Submission } from 'src/submissions/entities/submission.entity';
import { User } from 'src/users/entities/user.entity';

@ObjectType()
export class Grade {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  submissionId: number;

  @Field(() => Float)
  score: number;

  @Field(() => String, {
    nullable: true,
  })
  feedback?: string;

  @Field(() => Int)
  gradedById: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => Submission, {
    nullable: true,
  })
  submission?: Submission;

  @Field(() => User, {
    nullable: true,
  })
  gradedBy?: User;
}