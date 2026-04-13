import { CreateClassInput } from './create-class.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateClassInput extends PartialType(CreateClassInput) {
  @Field(() => Int)
  id: number;
}
