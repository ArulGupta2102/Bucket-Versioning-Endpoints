import { Controller, Get, Param, Delete, Res, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { BucketVersioningService } from './bucket-versioning.service';

interface MulterFile {
  buffer: Buffer;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  fieldname: string;
}

/**
 * BucketVersioningController provides endpoints for bucket versioning operations.
 */
@Controller('bucket-versioning')
export class BucketVersioningController {
  constructor(private readonly bucketVersioningService: BucketVersioningService) {}

  /**
   * Checks if versioning is enabled for the bucket.
   * @returns Promise resolving to versioning status.
   */
  @Get('status')
  async getVersioningStatus(): Promise<{ enabled: boolean }> {
    const enabled = await this.bucketVersioningService.isVersioningEnabled();
    return { enabled };
  }

  /**
   * Lists all versions of objects in the bucket.
   * @returns Promise resolving to the list of object versions.
   */
  @Get('versions')
  async listObjectVersions(): Promise<any[]> {
    return this.bucketVersioningService.listObjectVersions();
  }

  /**
   * Downloads a specific version of a file.
   * @param key - The key (path) of the file.
   * @param versionId - The version ID of the file.
   * @param res - The response object.
   */
  @Get('versions/:key/:versionId/download')
  async downloadObjectVersion(
    @Param('key') key: string,
    @Param('versionId') versionId: string,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.bucketVersioningService.getObjectVersion(key, versionId);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${key}"`,
    });
    res.send(buffer);
  }

  /**
   * Deletes a specific version of an object.
   * @param key - The key (path) of the object.
   * @param versionId - The version ID of the object to delete.
   * @returns Promise resolving to the delete result.
   */
  @Delete('versions/:key/:versionId')
  async deleteObjectVersion(
    @Param('key') key: string,
    @Param('versionId') versionId: string,
  ): Promise<any> {
    return this.bucketVersioningService.deleteObjectVersion(key, versionId);
  }

  /**
   * Retrieves the current (latest) version of an object with metadata.
   * @param key - The key (path) of the object.
   * @param res - The response object.
   */
  @Get('current/:key')
  async getCurrentObjectVersion(
    @Param('key') key: string,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, metadata } = await this.bucketVersioningService.getCurrentObjectVersion(key);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${key}"`,
      ...metadata,
    });
    res.send(buffer);
  }

  /**
   * Downloads the latest version of an object.
   * @param key - The key (path) of the object.
   * @param res - The response object.
   */
  @Get('download/:key')
  async downloadLatestObject(
    @Param('key') key: string,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.bucketVersioningService.downloadFile(key);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${key}"`,
    });
    res.send(buffer);
  }

  /**
   * Retrieves a specific version of an object with metadata.
   * @param key - The key (path) of the object.
   * @param versionId - The version ID of the object.
   * @param res - The response object.
   */
  @Get('versions/:key/:versionId/metadata')
  async getObjectVersionWithMetadata(
    @Param('key') key: string,
    @Param('versionId') versionId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, metadata } = await this.bucketVersioningService.getObjectVersionWithMetadata(key, versionId);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${key}"`,
      ...metadata,
    });
    res.send(buffer);
  }

  /**
   * Deletes an object by adding a delete marker.
   * @param key - The key (path) of the object.
   * @returns Promise resolving to the version ID of the delete marker.
   */
  @Delete('delete/:key')
  async deleteObjectWithMarker(@Param('key') key: string): Promise<{ deleteVersionId: string | undefined }> {
    const deleteVersionId = await this.bucketVersioningService.deleteObjectWithMarker(key);
    return { deleteVersionId };
  }

  /**
   * Undeletes an object by removing the delete marker.
   * @param key - The key (path) of the object.
   * @returns Promise resolving to the delete result.
   */
  @Put('undelete/:key')
  async undeleteObject(@Param('key') key: string): Promise<any> {
    return this.bucketVersioningService.undeleteObject(key);
  }


  /**
   * Lists all versions of a specific object in the bucket.
   * @param key - The key (path) of the object.
   * @returns Promise resolving to the list of object versions.
   */
  @Get('versions/:key')
  async listObjectVersionsForKey(@Param('key') key: string): Promise<any[]> {
    return this.bucketVersioningService.listObjectVersionsForKey(key);
  }

  /**
   * Uploads a file to the bucket.
   * @param file - The uploaded file.
   * @param key - The key (path) for the file in the bucket.
   * @returns Promise resolving to the upload result.
   */
  @Post('upload/:key')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: MulterFile,
    @Param('key') key: string,
  ): Promise<any> {
    return this.bucketVersioningService.uploadFile(file.buffer, key);
  }
}