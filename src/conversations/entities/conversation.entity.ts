import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum ConversationType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
}

registerEnumType(ConversationType, {
  name: 'ConversationType',
  description: 'Conversation type',
});

@ObjectType()
export class Conversation {
  @Field(() => Int, { description: 'Conversation Id' })
  id: number;

  @Field(() => ConversationType, {
    description: 'Conversation Type',
  })
  type: ConversationType;

  @Field(() => String, {
    nullable: true,
    description: 'Conversation Name',
  })
  name?: string;

  @Field(() => Int, { description: 'Conversation Creator Id' })
  created_by: number;

  @Field(() => Date, { description: 'Conversation Created At' })
  createdAt: Date;

  @Field(() => Date, { description: 'Conversation Updated At' })
  updatedAt: Date;
}
