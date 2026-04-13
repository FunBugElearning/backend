import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateRoleInput {
  @Field(() => String, { description: 'Role Name' })
  name: string;

  @Field(() => String, {
    nullable: true,
    description: 'Role Description',
  })
  description?: string;
}
