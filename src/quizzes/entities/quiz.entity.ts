import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class QuizOption {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  questionId: number;

  @Field(() => String)
  text: string;

  @Field(() => Boolean, {
    description:
      'Admin/teacher management view only - never returned by the student-facing quizToTake query.',
  })
  isCorrect: boolean;

  @Field(() => Int)
  order: number;
}

@ObjectType()
export class QuizQuestion {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  quizId: number;

  @Field(() => String)
  prompt: string;

  @Field(() => Int)
  order: number;

  @Field(() => Float)
  points: number;

  @Field(() => [QuizOption])
  options: QuizOption[];
}

@ObjectType()
export class Quiz {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  assignmentId: number;

  @Field(() => Int, { nullable: true })
  createdById?: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => [QuizQuestion])
  questions: QuizQuestion[];
}
