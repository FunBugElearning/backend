import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Message {
  @Field(() => Int, { description: 'Message Id' })
  id: number;

  @Field(() => Int, { description: 'Conversation Id' })
  conversation_id: number;

  @Field(() => Int, { description: 'Message Sender Id' })
  sender_id: number;

  @Field(() => String, { description: 'Message Content' })
  content: string;

  @Field(() => Date, { description: 'Message Sent At' })
  sentAt: Date;

  @Field(() => Date, {
    nullable: true,
    description: 'Message Edited At',
  })
  editedAt?: Date;

  @Field(() => Date, {
    nullable: true,
    description: 'Message Deleted At',
  })
  deletedAt?: Date;
}
