import { Field, Int, ObjectType } from '@nestjs/graphql';
import { StudentGradebook } from './student-gradebook.entity';

@ObjectType()
export class ClassGradebook {
  @Field(() => Int)
  classId: number;

  @Field(() => String)
  className: string;

  @Field(() => [StudentGradebook])
  students: StudentGradebook[];
}
