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

  // See attendance/dto/create-attendance-session.input.ts for why @IsDate(),
  // not @IsDateString().
  @Field(() => Date)
  @Type(() => Date)
  @IsDate()
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

  // Omitted or 'draft' -> not visible to students until publishAssignment is
  // called. Passing 'published' here publishes immediately at creation time.
  @Field(() => AssignmentStatus, {
    nullable: true,
    defaultValue: 'draft',
  })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @Field(() => Boolean, {
    nullable: true,
    defaultValue: true,
  })
  @IsOptional()
  @IsBoolean()
  allowResubmit?: boolean;
}
