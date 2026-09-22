import { Field, Int, ObjectType } from '@nestjs/graphql';
import { User } from './user.entity';

@ObjectType()
export class UserPagination {
  @Field(() => [User])
  items: User[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}
