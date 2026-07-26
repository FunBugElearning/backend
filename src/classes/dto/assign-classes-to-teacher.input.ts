import { Field, InputType, Int } from '@nestjs/graphql';
import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

@InputType()
export class AssignClassesToTeacherInput {
  @Field(() => Int)
  @IsInt()
  teacherId: number;

  @Field(() => [Int])
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  classIds: number[];
}
