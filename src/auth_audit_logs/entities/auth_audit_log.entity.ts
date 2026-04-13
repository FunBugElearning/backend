import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class AuthAuditLog {
  @Field(() => Int, { description: 'Audit Log Id' })
  id: number;

  @Field(() => Int, { description: 'User Id' })
  user_id: number;

  @Field(() => String, { description: 'Event Type' })
  event_type: string;

  @Field(() => String, { description: 'IP Address' })
  ip_address: string;

  @Field(() => String, { description: 'Browser Agent' })
  browser_agent: string;

  @Field(() => Date, { description: 'Date when event was created' })
  created_at: Date;
}
