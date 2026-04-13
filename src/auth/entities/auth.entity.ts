import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Role } from '../../roles/entities/role.entity';

@ObjectType()
export class AuthUser {
  @Field(() => Int, { description: 'User ID' })
  id: number;

  @Field(() => String, { description: 'User name' })
  name: string;

  @Field(() => String, { description: 'User email' })
  email: string;

  @Field(() => Role, { description: 'User role' })
  role: Role;
}

@ObjectType()
export class Auth {
  @Field(() => Boolean, { description: 'Authentication success state' })
  success: boolean;

  @Field(() => String, { description: 'Authentication response message' })
  message: string;

  @Field(() => String, {
    nullable: true,
    description: 'JWT access token (usually returned on login)',
  })
  accessToken?: string;

  @Field(() => String, {
    nullable: true,
    description: 'JWT refresh token (optional)',
  })
  refreshToken?: string;

  @Field(() => AuthUser, {
    nullable: true,
    description: 'Authenticated or newly registered user profile',
  })
  user?: AuthUser;
}
