import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateClassInput {
  @Field(() => String, { description: 'Class Name' })
  name: string;

  @Field(() => String, { description: 'Class Description', nullable: true })
  description: string;

  @Field(() => [Int], { description: 'Teacher IDs', nullable: true })
  teacherIds?: number[];

  @Field(() => [Int], { description: 'Student IDs', nullable: true })
  studentIds?: number[];
}
