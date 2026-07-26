import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, Min } from 'class-validator';

@InputType()
export class GetClassesInput {
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
}
