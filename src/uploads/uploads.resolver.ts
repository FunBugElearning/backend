import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

import { UploadsService } from './uploads.service';
import { UploadedFile } from './entities/uploaded-file.entity';
import { UploadImageInput } from './dto/upload-image.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { verifyAuthenticatedUser } from '../middleware/role-authorization.middleware';

@Resolver()
export class UploadsResolver {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Any authenticated user (teacher attaching assignment material, student
   * attaching a submission image). Returns a persisted, publicly-reachable
   * URL to attach via an assignment's/submission's existing `attachFiles`
   * field - this mutation only uploads and returns the URL.
   */
  @Mutation(() => UploadedFile)
  async uploadImage(
    @Args('input') input: UploadImageInput,
    @Context('req') req: Request,
  ) {
    const validation = await verifyAuthenticatedUser(req, this.prisma);

    if (!validation.ok) {
      throw new UnauthorizedException(validation.message);
    }

    return this.uploadsService.uploadImage(input);
  }
}
