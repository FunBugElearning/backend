import { Field, InputType, Int } from '@nestjs/graphql';
import { ArrayMinSize, IsArray, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class QuizAnswerInput {
  @Field(() => Int)
  @IsInt()
  questionId: number;

  @Field(() => Int)
  @IsInt()
  optionId: number;
}

@InputType()
export class SubmitQuizAttemptInput {
  @Field(() => Int)
  @IsInt()
  assignmentId: number;

  @Field(() => [QuizAnswerInput])
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerInput)
  answers: QuizAnswerInput[];
}
