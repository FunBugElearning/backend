import { CreateAuthaAuditLogInput } from './create-auth_audit_log.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateAuthaAuditLogInput extends PartialType(
  CreateAuthaAuditLogInput,
) {
  @Field(() => Int)
  id: number;
}
