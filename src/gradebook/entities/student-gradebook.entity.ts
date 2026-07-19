import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { GradebookCategoryScore } from './gradebook-category-score.entity';

@ObjectType()
export class StudentGradebook {
  @Field(() => Int)
  studentId: number;

  @Field(() => String)
  studentName: string;

  @Field(() => String)
  studentEmail: string;

  @Field(() => Float)
  finalScore: number;

  @Field(() => [GradebookCategoryScore])
  categoryScores: GradebookCategoryScore[];
}
