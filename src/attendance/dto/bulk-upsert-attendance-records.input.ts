import { Field, InputType, Int } from '@nestjs/graphql';
import { AttendanceStatus } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

@InputType()
export class AttendanceRecordInput {
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
export class BulkUpsertAttendanceRecordsInput {
  @Field(() => Int)
  @IsInt()
  attendanceSessionId: number;

  @Field(() => [AttendanceRecordInput])
  @IsArray()
  records: AttendanceRecordInput[];
}