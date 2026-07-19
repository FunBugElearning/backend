import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Assignment {
  @Field(() => Int, { description: 'Assignment ID' })
  id: number;

  @Field(() => String, { description: 'Assignment title' })
  title: string;

  @Field(() => String, {
    nullable: true,
    description: 'Assignment description',
  })
  description?: string;

  @Field(() => Date, { description: 'Assignment deadline' })
  deadline: Date;

  @Field(() => String, {
    nullable: true,
    description: 'Assignment topic',
  })
  topic?: string;

  @Field(() => [String], {
    description: 'Attached file URLs',
  })
  attachFiles: string[];

  @Field(() => Int, { description: 'Class ID' })
  classId: number;

  @Field(() => Date, { description: 'Created date' })
  createdAt: Date;

  @Field(() => Date, { description: 'Updated date' })
  updatedAt: Date;
}