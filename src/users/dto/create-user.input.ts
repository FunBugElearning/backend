import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateUserInput {
  @Field({ description: 'User name' })
  name: string;

  @Field({ description: 'User email' })
  email: string;

  @Field({ description: 'User password' })
  password: string;

  @Field({ description: 'User date of birth' })
  dateOfBirth: Date;

  @Field({ description: 'User address' })
  address: string;
}
