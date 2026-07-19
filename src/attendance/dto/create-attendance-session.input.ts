import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateAttendanceSessionInput {
  @Field(() => Int)
  @IsInt()
  classId: number;

  @Field(() => Date)
  @IsDateString()
  attendanceDate: Date;

  @Field(() => String, {
    nullable: true,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @Field(() => String, {
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
