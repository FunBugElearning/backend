import {
  Field,
  Float,
  InputType,
  Int,
} from '@nestjs/graphql';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

@InputType()
export class UpdateAssignmentInput {
  @Field(() => Int)
  @IsInt()
  id: number;

  @Field(() => String, {
    nullable: true,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @Field(() => String, {
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Date, {
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  deadline?: Date;

  @Field(() => String, {
    nullable: true,
  })
  @IsOptional()
  @IsString()
  topic?: string;

  @Field(() => [String], {
    nullable: true,
  })
  @IsOptional()
  @IsArray()
  attachFiles?: string[];

  @Field(() => Int, {
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @Field(() => Float, {
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  maxScore?: number;
}