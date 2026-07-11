import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

@InputType()
export class SubmitAssignmentInput {
  @Field(() => Int)
  @IsInt()
  assignmentId: number;

  @Field(() => String, {
    nullable: true,
  })
  @IsOptional()
  @IsString()
  content?: string;

  @Field(() => [String], {
    nullable: true,
  })
  @IsOptional()
  @IsArray()
  attachFiles?: string[];
}