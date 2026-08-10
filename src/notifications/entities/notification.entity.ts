import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { NotificationType } from '@prisma/client';

registerEnumType(NotificationType, {
  name: 'NotificationType',
});

@ObjectType()
export class Notification {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  userId: number;

  @Field(() => NotificationType)
  type: NotificationType;

  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  body?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Frontend route to navigate to when clicked',
  })
  link?: string;

  @Field(() => Boolean)
  read: boolean;

  @Field(() => Date)
  createdAt: Date;
}
