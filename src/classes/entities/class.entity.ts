import { ObjectType, Field, Int } from '@nestjs/graphql';
import { User } from 'src/users/entities/user.entity';

@ObjectType()
export class Class {
  @Field(() => Int, { description: 'Class Id' })
  id: number;

  @Field(() => String, { description: 'Class Name' })
  name: string;

  @Field(() => String, { description: 'Class Description', nullable: true })
  description: string;

  @Field(() => Date, { description: 'Class Created At' })
  createdAt: Date;

  @Field(() => Date, { description: 'Class Updated At' })
  updatedAt: Date;

  @Field(() => [User], {
    description: 'Teachers in this class',
    nullable: true,
  })
  teachers?: User[];

  @Field(() => [User], {
    description: 'Students in this class',
    nullable: true,
  })
  students?: User[];
}
