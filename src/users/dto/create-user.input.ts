import { InputType, Int, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field({ description: 'User name' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @Field({ description: 'User email' })
  @IsEmail()
  email: string;

  @Field({ description: 'User password' })
  @IsString()
  @MinLength(8)
  password: string;

  @Field({ description: 'User date of birth' })
  dateOfBirth: Date;

  @Field({ description: 'User address' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address: string;

  @Field({ nullable: true, description: 'User phonenumber' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;

  @Field(() => Int, { nullable: true, description: 'User role id' })
  @IsOptional()
  @IsInt()
  role_id?: number;
}
