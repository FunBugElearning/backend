import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UploadedFile {
  @Field(() => String, {
    description: 'Public, persisted URL of the uploaded image',
  })
  url: string;

  @Field(() => String)
  filename: string;

  @Field(() => Int, { description: 'Size in bytes' })
  size: number;
}
