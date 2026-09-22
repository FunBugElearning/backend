import { BadRequestException, Injectable } from '@nestjs/common';
import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';
import { UploadImageInput } from './dto/upload-image.input';

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
]);

// Base64-inflated size, checked before decoding so an oversized payload is
// rejected cheaply rather than after allocating a large Buffer.
const MAX_BASE64_LENGTH = 8 * 1024 * 1024; // ~6MB decoded

@Injectable()
export class UploadsService {
  async uploadImage(input: UploadImageInput) {
    if (!ALLOWED_MIME_TYPES.has(input.contentType.toLowerCase())) {
      throw new BadRequestException(
        `Unsupported image type "${input.contentType}". Allowed: ${[...ALLOWED_MIME_TYPES].join(', ')}`,
      );
    }

    if (input.base64Data.length > MAX_BASE64_LENGTH) {
      throw new BadRequestException('Image is too large (max ~6MB)');
    }

    let buffer: Buffer;

    try {
      buffer = Buffer.from(input.base64Data, 'base64');
    } catch {
      throw new BadRequestException('Invalid base64 image data');
    }

    if (buffer.length === 0) {
      throw new BadRequestException('Invalid base64 image data');
    }

    const safeExtension = input.contentType.split('/')[1] || 'bin';
    const pathname = `uploads/${randomUUID()}.${safeExtension}`;

    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType: input.contentType,
      // BLOB_READ_WRITE_TOKEN is read from process.env automatically.
    });

    return {
      url: blob.url,
      filename: input.filename,
      size: buffer.length,
    };
  }
}
