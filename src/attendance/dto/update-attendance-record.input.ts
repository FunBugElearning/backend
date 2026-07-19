import { Field, InputType, Int } from '@nestjs/graphql';
import { AttendanceStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

@InputType()
export class UpdateAttendanceRecordInput {
  @Field(() => Int)
  @IsInt()
  attendanceRecordId: number;

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
