import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateAuthaAuditLogInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
