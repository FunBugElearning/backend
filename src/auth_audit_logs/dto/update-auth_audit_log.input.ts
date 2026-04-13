import { CreateAuthAuditLogInput } from './create-auth_audit_log.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateAuthAuditLogInput extends PartialType(
  CreateAuthAuditLogInput,
) {
  @Field(() => Int)
  id: number;
}
