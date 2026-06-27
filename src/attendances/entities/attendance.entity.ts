import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT_EXCUSED = 'ABSENT_EXCUSED',
  ABSENT_UNEXCUSED = 'ABSENT_UNEXCUSED',
  LATE = 'LATE',
}

registerEnumType(AttendanceStatus, {
  name: 'AttendanceStatus',
  description: 'Student attendance status',
});

@ObjectType()
export class Attendance {
  @Field(() => Int, { description: 'Attendance Id' })
  id: number;

  @Field(() => Int, { description: 'Class Session Id' })
  session_id: number;

  @Field(() => Int, { description: 'Student Id' })
  student_id: number;

  @Field(() => AttendanceStatus, {
    description: 'Student Attendance Status',
  })
  status: AttendanceStatus;

  @Field(() => String, {
    nullable: true,
    description: 'Attendance Note',
  })
  note?: string;

  @Field(() => Date, { description: 'Attendance Checked At' })
  checkedAt: Date;

  @Field(() => Date, { description: 'Attendance Created At' })
  createdAt: Date;

  @Field(() => Date, { description: 'Attendance Updated At' })
  updatedAt: Date;
}
