import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AssignmentAttachment {
  @Field(() => Int, { description: 'Assignment Attachment Id' })
  id: number;

  @Field(() => Int, { description: 'Assignment Id' })
  assignment_id: number;

  @Field(() => Int, { description: 'File Asset Id' })
  file_id: number;

  @Field(() => Date, { description: 'Assignment Attachment Created At' })
  createdAt: Date;
}
