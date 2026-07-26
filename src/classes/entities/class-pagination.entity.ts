import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Class } from './class.entity';

@ObjectType()
export class ClassPagination {
  @Field(() => [Class])
  items: Class[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}
