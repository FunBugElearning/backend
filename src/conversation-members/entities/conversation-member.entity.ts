import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ConversationMember {
  @Field(() => Int, { description: 'Conversation Member Id' })
  id: number;

  @Field(() => Int, { description: 'Conversation Id' })
  conversation_id: number;

  @Field(() => Int, { description: 'User Id' })
  user_id: number;

  @Field(() => Date, { description: 'Conversation Member Joined At' })
  joinedAt: Date;

  @Field(() => Date, {
    nullable: true,
    description: 'Conversation Member Left At',
  })
  leftAt?: Date;
}
