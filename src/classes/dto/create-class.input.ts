import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateClassInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
