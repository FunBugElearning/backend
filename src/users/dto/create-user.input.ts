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

  @Field({ nullable: true, description: 'User phonenumber' })
  phoneNumber?: string;

  @Field(() => Int, { nullable: true, description: 'User role id' })
  role_id?: number;
}
