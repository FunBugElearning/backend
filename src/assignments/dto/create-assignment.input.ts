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
export class CreateAssignmentInput {
  @Field(() => String)
  @IsString()
  title: string;

  @Field(() => String, {
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Date)
  @IsDateString()
  deadline: Date;

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

  @Field(() => Int)
  @IsInt()
  classId: number;

  @Field(() => Int, {
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @Field(() => Float, {
    nullable: true,
    defaultValue: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  maxScore?: number;
}