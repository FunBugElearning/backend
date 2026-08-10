import { InputType, Int, Field } from '@nestjs/graphql';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

@InputType()
export class CreateClassInput {
  @Field(() => String, { description: 'Class Name' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @Field(() => String, { description: 'Class Description', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description: string;

  @Field(() => [Int], { description: 'Teacher IDs', nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  teacherIds?: number[];

  @Field(() => [Int], { description: 'Student IDs', nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  studentIds?: number[];
}
