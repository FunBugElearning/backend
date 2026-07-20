import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

@InputType()
export class CreateAttendanceRecordItemInput {
  @Field(() => Int)
  @IsInt()
  studentId: number;

  @Field(() => AttendanceStatus)
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @Field(() => String, {
    nullable: true,
  })
  @IsOptional()
  @IsString()
  note?: string;
}

@InputType()
export class CreateAttendanceRecordsInput {
  @Field(() => Int)
  @IsInt()
  attendanceSessionId: number;

  @Field(() => [CreateAttendanceRecordItemInput])
  @IsArray()
  records: CreateAttendanceRecordItemInput[];
}