import { CreateAuthSessionInput } from './create-auth_session.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateAuthSessionInput extends PartialType(
  CreateAuthSessionInput,
) {
  @Field(() => Int)
  id: number;
}
