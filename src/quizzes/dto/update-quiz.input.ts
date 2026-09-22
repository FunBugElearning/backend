import { Field, InputType, Int } from '@nestjs/graphql';
import { ArrayMinSize, IsArray, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { QuizQuestionInput } from './quiz-question.input';

// Replaces every question/option on the quiz - simplest correct behavior
// for a small quiz editor, avoids diffing individual question/option edits.
@InputType()
export class UpdateQuizInput {
  @Field(() => Int)
  @IsInt()
  quizId: number;

  @Field(() => [QuizQuestionInput])
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionInput)
  questions: QuizQuestionInput[];
}
