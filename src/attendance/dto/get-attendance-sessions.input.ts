import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDate, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class GetAttendanceSessionsInput {
  @Field(() => Int)
  @IsInt()
  classId: number;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  // See create-attendance-session.input.ts for why @IsDate(), not @IsDateString().
  @Field(() => Date, {
    nullable: true,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fromDate?: Date;

  @Field(() => Date, {
    nullable: true,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  toDate?: Date;
}
