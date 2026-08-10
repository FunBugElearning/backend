import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDate, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class CreateAttendanceSessionInput {
  @Field(() => Int)
  @IsInt()
  classId: number;

  // Note: the GraphQL Date scalar already parses the wire value into a
  // native Date before class-validator sees it, so this must be @IsDate(),
  // not @IsDateString() (which expects a raw string and would always fail).
  @Field(() => Date)
  @Type(() => Date)
  @IsDate()
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
