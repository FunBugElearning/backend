import { Field, Float, InputType, Int } from '@nestjs/graphql';
import {
  IsInt,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';

@InputType()
export class CreateGradeCategoryInput {
  @Field(() => Int)
  @IsInt()
  classId: number;

  @Field(() => String)
  @IsString()
  name: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0.01)
  @Max(100)
  weight: number;
}