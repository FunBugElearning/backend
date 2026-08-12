import { Field, InputType } from '@nestjs/graphql';
import { IsDate, IsEmail, IsIn, IsOptional } from 'class-validator';

@InputType()
export class RegisterAuthInput {
  @Field(() => String, {
    description: 'User Name',
  })
  name: string;

  @Field(() => String, {
    nullable: true,
    description: 'User Email',
  })
  @IsEmail()
  email: string;

  @Field(() => String, {
    description: 'User Password',
  })
  password: string;

  @Field(() => Date, {
    description: 'User Date of Birth',
  })
  @IsDate({ message: 'dateOfBirth is required and must be a valid date' })
  dateOfBirth: Date;

  @Field(() => String, {
    nullable: true,
    description: 'User Address',
  })
  address?: string;

  @Field(() => String, {
    nullable: true,
    description: 'User Phonenumber',
  })
  phoneNumber?: string;

  @Field(() => String, {
    nullable: true,
    description: 'User Role: admin, teacher, or student',
  })
  @IsOptional()
  @IsIn(['admin', 'teacher', 'student'])
  role?: string;
}
