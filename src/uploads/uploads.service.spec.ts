import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { put } from '@vercel/blob';

jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
}));

const mockedPut = put as jest.Mock;

describe('UploadsService', () => {
  let service: UploadsService;

  beforeEach(async () => {
    mockedPut.mockReset();
    mockedPut.mockResolvedValue({
      url: 'https://example.public.blob.vercel-storage.com/uploads/fake.png',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadsService],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('uploads a valid PNG image and returns its persisted URL', async () => {
    const result = await service.uploadImage({
      filename: 'photo.png',
      contentType: 'image/png',
      base64Data: Buffer.from('fake-image-bytes').toString('base64'),
    });

    expect(mockedPut).toHaveBeenCalled();
    expect(result.url).toBe(
      'https://example.public.blob.vercel-storage.com/uploads/fake.png',
    );
    expect(result.size).toBeGreaterThan(0);
  });

  it('rejects a non-image content type', async () => {
    await expect(
      service.uploadImage({
        filename: 'evil.exe',
        contentType: 'application/x-msdownload',
        base64Data: Buffer.from('x').toString('base64'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(mockedPut).not.toHaveBeenCalled();
  });

  it('rejects an oversized payload', async () => {
    await expect(
      service.uploadImage({
        filename: 'huge.png',
        contentType: 'image/png',
        base64Data: 'a'.repeat(9 * 1024 * 1024),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(mockedPut).not.toHaveBeenCalled();
  });

  it('rejects empty/invalid base64 data', async () => {
    await expect(
      service.uploadImage({
        filename: 'empty.png',
        contentType: 'image/png',
        base64Data: '',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
