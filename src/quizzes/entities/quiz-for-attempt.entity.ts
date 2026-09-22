import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

// Deliberately separate types from Quiz/QuizQuestion/QuizOption: there is
// structurally no `isCorrect` field anywhere on this side, so the
// student-facing `quizToTake` query cannot leak the answer key regardless
// of what a client requests.
@ObjectType()
export class QuizOptionForAttempt {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  text: string;

  @Field(() => Int)
  order: number;
}

@ObjectType()
export class QuizQuestionForAttempt {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  prompt: string;

  @Field(() => Int)
  order: number;

  @Field(() => Float)
  points: number;

  @Field(() => [QuizOptionForAttempt])
  options: QuizOptionForAttempt[];
}

@ObjectType()
export class QuizForAttempt {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  assignmentId: number;

  @Field(() => [QuizQuestionForAttempt])
  questions: QuizQuestionForAttempt[];
}
