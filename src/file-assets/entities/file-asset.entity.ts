import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FileAsset {
  @Field(() => Int, { description: 'File Asset Id' })
  id: number;

  @Field(() => Int, { description: 'Uploader User Id' })
  uploaded_by: number;

  @Field(() => String, { description: 'Original File Name' })
  originalName: string;

  @Field(() => String, { description: 'File MIME Type' })
  mimeType: string;

  @Field(() => Int, { description: 'File Size In Bytes' })
  size: number;

  @Field(() => String, { description: 'Storage Bucket Name' })
  bucket: string;

  @Field(() => String, { description: 'Storage Object Key' })
  objectKey: string;

  @Field(() => String, {
    nullable: true,
    description: 'File URL',
  })
  url?: string;

  @Field(() => Date, { description: 'File Asset Created At' })
  createdAt: Date;

  @Field(() => Date, { description: 'File Asset Updated At' })
  updatedAt: Date;
}
