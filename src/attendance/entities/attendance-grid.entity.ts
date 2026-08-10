import { Field, Int, ObjectType } from '@nestjs/graphql';
import { AttendanceStatus } from '@prisma/client';
import { User } from 'src/users/entities/user.entity';

@ObjectType()
export class AttendanceGridColumn {
  @Field(() => Int)
  sessionId: number;

  @Field(() => Date)
  attendanceDate: Date;

  @Field(() => String, { nullable: true })
  title?: string | null;
}

@ObjectType()
export class AttendanceGridCell {
  @Field(() => Int)
  sessionId: number;

  @Field(() => Int, { nullable: true, description: 'null if not yet marked' })
  recordId?: number | null;

  @Field(() => AttendanceStatus, {
    nullable: true,
    description: 'null if not yet marked',
  })
  status?: AttendanceStatus | null;

  @Field(() => String, { nullable: true })
  note?: string | null;
}

@ObjectType()
export class AttendanceGridRow {
  @Field(() => User)
  student: User;

  @Field(() => [AttendanceGridCell])
  cells: AttendanceGridCell[];
}

@ObjectType()
export class AttendanceGrid {
  @Field(() => Int)
  classId: number;

  @Field(() => [AttendanceGridColumn])
  columns: AttendanceGridColumn[];

  @Field(() => [AttendanceGridRow])
  rows: AttendanceGridRow[];
}
