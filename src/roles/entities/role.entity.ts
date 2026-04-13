import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class Role {
  @Field(() => Int, { description: 'Role Id' })
  id: number;

  @Field(() => String, { description: 'Role Name' })
  name: string;

  @Field(() => String, { nullable: true, description: 'Role Description' })
  description?: string;

  @Field(() => Date, { description: 'Role Created At' })
  createdAt: Date;

  @Field(() => Date, { description: 'Role Updated At' })
  updatedAt: Date;
}
