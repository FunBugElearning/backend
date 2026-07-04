import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateAssignmentInput {
  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => Date)
  deadline: Date;

  @Field(() => String, { nullable: true })
  topic?: string;

  @Field(() => [String], { nullable: true })
  attachFiles?: string[];

  @Field(() => Int)
  classId: number;
}