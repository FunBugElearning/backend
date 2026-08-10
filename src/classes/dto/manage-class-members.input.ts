import { Field, InputType, Int } from '@nestjs/graphql';
import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

@InputType()
export class ManageClassMembersInput {
  @Field(() => Int)
  @IsInt()
  classId: number;

  @Field(() => [Int])
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  userIds: number[];
}
