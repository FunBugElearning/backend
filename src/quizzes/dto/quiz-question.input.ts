import { Field, Float, InputType, Int } from '@nestjs/graphql';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class QuizOptionInput {
  @Field(() => String)
  @IsString()
  text: string;

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  isCorrect: boolean;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

@InputType()
export class QuizQuestionInput {
  @Field(() => String)
  @IsString()
  prompt: string;

  @Field(() => Float, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  points?: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @Field(() => [QuizOptionInput])
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => QuizOptionInput)
  options: QuizOptionInput[];
}
