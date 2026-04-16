import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class LoginAuthInput {
  @Field({ description: 'User email' })
  email: string;

  @Field({ description: 'User password' })
  password: string;
}
