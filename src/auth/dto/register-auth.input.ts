import { InputType, Int, Field } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';

@InputType()
export class RegisterAuthInput {
  @Field(() => String, { description: 'User Name' })
  name: string;

  @Field(() => String, { nullable: true, description: 'User Email' })
  @IsEmail()
  email: string;

  @Field(() => String, { description: 'User Password' })
  password: string;

  @Field(() => Date, { description: 'User Date of Birth' })
  dateOfBirth: Date;

  @Field(() => String, { nullable: true, description: 'User Address' })
  address?: string;

  @Field(() => String, { nullable: true, description: 'User Phonenumber' })
  phoneNumber?: string;
}
