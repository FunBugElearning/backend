import { Field, Float, InputType, Int } from '@nestjs/graphql';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssignmentStatus } from '@prisma/client';

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

  // See attendance/dto/create-attendance-session.input.ts for why @IsDate(),
  // not @IsDateString().
  @Field(() => Date, {
    nullable: true,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
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

  @Field(() => AssignmentStatus, {
    nullable: true,
  })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @Field(() => Boolean, {
    nullable: true,
  })
  @IsOptional()
  @IsBoolean()
  allowResubmit?: boolean;
}
