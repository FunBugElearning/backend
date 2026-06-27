import {
  Field,
  Float,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

export enum SubmissionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  LATE = 'LATE',
  GRADED = 'GRADED',
  RETURNED = 'RETURNED',
}

registerEnumType(SubmissionStatus, {
  name: 'SubmissionStatus',
  description: 'Assignment submission status',
});

@ObjectType()
export class Submission {
  @Field(() => Int, { description: 'Submission Id' })
  id: number;

  @Field(() => Int, { description: 'Assignment Id' })
  assignment_id: number;

  @Field(() => Int, { description: 'Student Id' })
  student_id: number;

  @Field(() => String, {
    nullable: true,
    description: 'Submission Content',
  })
  content?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Submission File URL',
  })
  fileUrl?: string;

  @Field(() => SubmissionStatus, {
    description: 'Submission Status',
  })
  status: SubmissionStatus;

  @Field(() => Date, {
    nullable: true,
    description: 'Submission Submitted At',
  })
  submittedAt?: Date;

  @Field(() => Float, {
    nullable: true,
    description: 'Submission Score',
  })
  score?: number;

  @Field(() => String, {
    nullable: true,
    description: 'Teacher Feedback',
  })
  teacherFeedback?: string;

  @Field(() => Date, {
    nullable: true,
    description: 'Submission Graded At',
  })
  gradedAt?: Date;

  @Field(() => Date, { description: 'Submission Created At' })
  createdAt: Date;

  @Field(() => Date, { description: 'Submission Updated At' })
  updatedAt: Date;
}
