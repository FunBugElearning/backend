import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class ManageClassMembersInput {
  @Field(() => Int)
  classId: number;

  @Field(() => [Int])
  userIds: number[];
}