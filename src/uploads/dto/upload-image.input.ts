import { Field, InputType } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';

@InputType()
export class UploadImageInput {
  @Field(() => String)
  @IsString()
  @MinLength(1)
  filename: string;

  @Field(() => String, {
    description: 'e.g. "image/png", "image/jpeg"',
  })
  @IsString()
  contentType: string;

  @Field(() => String, {
    description: 'Raw base64 image data, no "data:image/...;base64," prefix.',
  })
  @IsString()
  @MinLength(1)
  base64Data: string;
}
