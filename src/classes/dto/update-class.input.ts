import { CreateClassInput } from './create-class.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { IsInt } from 'class-validator';

@InputType()
export class UpdateClassInput extends PartialType(CreateClassInput) {
  @Field(() => Int)
  @IsInt()
  id: number;
}
