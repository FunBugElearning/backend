import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
export class AutoGradeResult {
  @Field(() => Int, { description: 'Auto Grade Result Id' })
  id: number;

  @Field(() => Int, { description: 'Submission Id' })
  submission_id: number;

  @Field(() => Float, {
    nullable: true,
    description: 'AI Suggested Score',
  })
  suggestedScore?: number;

  @Field(() => String, {
    nullable: true,
    description: 'AI Suggested Feedback',
  })
  suggestedFeedback?: string;

  @Field(() => Float, {
    nullable: true,
    description: 'AI Confidence Score',
  })
  confidence?: number;

  @Field(() => String, {
    nullable: true,
    description: 'AI Model Name',
  })
  modelName?: string;

  @Field(() => GraphQLJSON, {
    nullable: true,
    description: 'Raw AI Response',
  })
  rawResponse?: Record<string, unknown>;

  @Field(() => Date, { description: 'Auto Grade Result Created At' })
  createdAt: Date;

  @Field(() => Date, { description: 'Auto Grade Result Updated At' })
  updatedAt: Date;
}
