import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Class } from 'src/classes/entities/class.entity';
import { User } from 'src/users/entities/user.entity';
import { AttendanceRecord } from './attendance-record.entity';

@ObjectType()
export class AttendanceSession {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  classId: number;

  @Field(() => Int)
  createdById: number;

  @Field(() => Date)
  attendanceDate: Date;

  @Field(() => String, {
    nullable: true,
  })
  title?: string;

  @Field(() => String, {
    nullable: true,
  })
  description?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => Class, {
    nullable: true,
  })
  class?: Class;

  @Field(() => User, {
    nullable: true,
  })
  createdBy?: User;

  @Field(() => [AttendanceRecord], {
    nullable: true,
  })
  records?: AttendanceRecord[];
}
