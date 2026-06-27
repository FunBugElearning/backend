import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum NotificationType {
  SYSTEM = 'SYSTEM',
  ASSIGNMENT = 'ASSIGNMENT',
  GRADE = 'GRADE',
  ATTENDANCE = 'ATTENDANCE',
  REPORT = 'REPORT',
  MESSAGE = 'MESSAGE',
}

registerEnumType(NotificationType, {
  name: 'NotificationType',
  description: 'Notification type',
});

@ObjectType()
export class Notification {
  @Field(() => Int, { description: 'Notification Id' })
  id: number;

  @Field(() => Int, { description: 'Notification Recipient Id' })
  recipient_id: number;

  @Field(() => Int, {
    nullable: true,
    description: 'Notification Creator Id',
  })
  created_by?: number;

  @Field(() => NotificationType, {
    description: 'Notification Type',
  })
  type: NotificationType;

  @Field(() => String, { description: 'Notification Title' })
  title: string;

  @Field(() => String, { description: 'Notification Message' })
  message: string;

  @Field(() => Boolean, { description: 'Notification Read Status' })
  isRead: boolean;

  @Field(() => Date, {
    nullable: true,
    description: 'Notification Read At',
  })
  readAt?: Date;

  @Field(() => Date, { description: 'Notification Created At' })
  createdAt: Date;

  @Field(() => Date, { description: 'Notification Updated At' })
  updatedAt: Date;
}
