import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { AttendanceStatus } from '@prisma/client';
import { User } from 'src/users/entities/user.entity';

registerEnumType(AttendanceStatus, {
  name: 'AttendanceStatus',
});

@ObjectType()
export class AttendanceRecord {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  attendanceSessionId: number;

  @Field(() => Int)
  studentId: number;

  @Field(() => AttendanceStatus)
  status: AttendanceStatus;

  @Field(() => String, {
    nullable: true,
  })
  note?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => User, {
    nullable: true,
  })
  student?: User;
}
