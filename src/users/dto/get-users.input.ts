import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

@InputType()
export class GetUsersInput {
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

  @Field(() => String, {
    nullable: true,
    description: 'Case-insensitive partial match against name or email',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Filter to a single role, e.g. "student" or "teacher"',
  })
  @IsOptional()
  @IsIn(['admin', 'teacher', 'student'])
  roleName?: string;

  @Field(() => Int, {
    nullable: true,
    description: 'Only users enrolled in / assigned to this class',
  })
  @IsOptional()
  @IsInt()
  classId?: number;
}
