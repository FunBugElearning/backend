import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class Role {
  @Field(() => Int, { description: 'Role Id' })
  id: number;

  @Field(() => String, { description: 'Role Name' })
  name: string;
}
