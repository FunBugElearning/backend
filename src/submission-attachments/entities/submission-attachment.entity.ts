import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SubmissionAttachment {
  @Field(() => Int, { description: 'Submission Attachment Id' })
  id: number;

  @Field(() => Int, { description: 'Submission Id' })
  submission_id: number;

  @Field(() => Int, { description: 'File Asset Id' })
  file_id: number;

  @Field(() => Date, { description: 'Submission Attachment Created At' })
  createdAt: Date;
}
