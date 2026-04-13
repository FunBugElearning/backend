import { Field, Int, ObjectType } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';

enum Role {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
}

@ObjectType()
export class User {
  @Field(() => Int, { description: 'User Id' })
  id: number;

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

  @Field(() => String, { description: 'User Role', defaultValue: 'student' })
  role: Role;

  @Field(() => Date, { description: 'User Created At' })
  createdAt: Date;

  @Field(() => Date, { description: 'User Updated At' })
  updatedAt: Date;
}
