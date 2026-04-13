import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class AuthSession {
  @Field(() => Int, { description: 'Session Id' })
  id: number;

  @Field(() => Int, { description: 'User Id' })
  user_id: number;

  @Field(() => String, { description: "Hash of refresh token"})
  refresh_toke_hash: string;

  @Field(() => String, { description: "Name of browser"})
  browser_agent: string;

  @Field(() => String, { description: "Ip address"})
  ip_address: string;

  @Field(() => Date, { description: "Date when session will be expired"})
  expired_at: Date;

  @Field(() => Date, { description: "Date when session was rotated"})
  rotated_at: Date;

  @Field(() => Date, { description: "Date when session was revoked", nullable: true })
  revoked_at: Date;

  @Field(() => Date, { description: "Date when session was created"})
  created_at: Date;

  @Field(() => String, { description: "Family Id"})
  family_id: string;

  @Field(() => String, { description: "JWT ID"})
  jti: string;
}
