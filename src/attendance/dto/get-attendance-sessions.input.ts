import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

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

  @Field(() => Date, {
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  fromDate?: Date;

  @Field(() => Date, {
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  toDate?: Date;
}
