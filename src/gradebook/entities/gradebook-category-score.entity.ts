import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GradebookCategoryScore {
  @Field(() => Int)
  categoryId: number;

  @Field(() => String)
  categoryName: string;

  @Field(() => Float)
  weight: number;

  @Field(() => Float)
  averagePercent: number;

  @Field(() => Float)
  weightedScore: number;
}