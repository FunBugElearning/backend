import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class QuizAttempt {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  quizId: number;

  @Field(() => Int)
  studentId: number;

  @Field(() => Int)
  submissionId: number;

  @Field(() => Float)
  score: number;

  @Field(() => Float)
  maxScore: number;

  @Field(() => Date)
  submittedAt: Date;
}
