import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Class } from 'src/classes/entities/class.entity';

@ObjectType()
export class ClassGradeCategory {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  classId: number;

  @Field(() => String)
  name: string;

  @Field(() => Float)
  weight: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => Class, {
    nullable: true,
  })
  class?: Class;
}
