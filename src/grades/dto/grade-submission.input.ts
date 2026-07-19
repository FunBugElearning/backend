import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

@InputType()
export class GradeSubmissionInput {
  @Field(() => Int)
  @IsInt()
  submissionId: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  score: number;

  @Field(() => String, {
    nullable: true,
  })
  @IsOptional()
  @IsString()
  feedback?: string;
}
