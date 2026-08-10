import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Notification } from './notification.entity';

@ObjectType()
export class NotificationPagination {
  @Field(() => [Notification])
  items: Notification[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}
