import { Field, Int, ObjectType } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';
import { Role } from '../../roles/entities/role.entity';

@ObjectType()
export class User {
  @Field(() => Int, { description: 'User Id' })
  id: number;

  @Field(() => String, { description: 'User Name' })
  name: string;

  @Field(() => String, { nullable: true, description: 'User Email' })
  @IsEmail()
  email: string;

  // Intentionally not a GraphQL @Field: the bcrypt hash must never be exposed
  // over the API, even to admins.
  password: string;

  @Field(() => Date, { description: 'User Date of Birth' })
  dateOfBirth: Date;

  @Field(() => String, { nullable: true, description: 'User Address' })
  address?: string;

  @Field(() => String, { nullable: true, description: 'User Phonenumber' })
  phoneNumber?: string;

  @Field(() => Int, { description: 'User Role Id' })
  role_id: number;

  @Field(() => Role, { description: 'User Role' })
  role: Role;

  @Field(() => Date, { description: 'User Created At' })
  createdAt: Date;

  @Field(() => Date, { description: 'User Updated At' })
  updatedAt: Date;
}
