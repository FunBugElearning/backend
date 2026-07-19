import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class AssignClassesToTeacherInput {
  @Field(() => Int)
  teacherId: number;

  @Field(() => [Int])
  classIds: number[];
}