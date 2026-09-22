import { Field, InputType, Int } from '@nestjs/graphql';
import { ArrayMinSize, IsArray, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { QuizQuestionInput } from './quiz-question.input';

@InputType()
export class CreateQuizInput {
  @Field(() => Int)
  @IsInt()
  assignmentId: number;

  @Field(() => [QuizQuestionInput])
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionInput)
  questions: QuizQuestionInput[];
}
