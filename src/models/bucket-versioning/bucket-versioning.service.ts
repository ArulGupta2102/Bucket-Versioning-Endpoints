import { Injectable } from '@nestjs/common';
import { StorjService } from '../storj/storj.service';

/**
 * BucketVersioningService provides methods to manage bucket versioning operations.
 */
@Injectable()
export class BucketVersioningService {
  constructor(private readonly storjService: StorjService) {}

  /**
   * Checks if versioning is enabled for the bucket.
   * @returns Promise resolving to true if versioning is enabled, false otherwise.
   */
  async isVersioningEnabled(): Promise<boolean> {
    return this.storjService.isVersioningEnabled();
  }

  /**
   * Lists all versions of objects in the bucket.
   * @returns Promise resolving to the list of object versions.
   */
  async listObjectVersions(): Promise<any[]> {
    return this.storjService.listObjectVersions();
  }

  /**
   * Downloads a specific version of a file.
   * @param key - The key (path) of the file.
   * @param versionId - The version ID of the file.
   * @returns Promise resolving to the file buffer.
   */
  async getObjectVersion(key: string, versionId: string): Promise<Buffer> {
    return this.storjService.getObjectVersion(key, versionId);
  }

  /**
   * Deletes a specific version of an object.
   * @param key - The key (path) of the object.
   * @param versionId - The version ID of the object to delete.
   * @returns Promise resolving to the delete result.
   */
  async deleteObjectVersion(key: string, versionId: string): Promise<any> {
    return this.storjService.deleteObjectVersion(key, versionId);
  }

  /**
   * Retrieves the current (latest) version of an object with metadata.
   * @param key - The key (path) of the object.
   * @returns Promise resolving to object with buffer and metadata.
   */
  async getCurrentObjectVersion(key: string): Promise<{ buffer: Buffer, metadata: any }> {
    return this.storjService.getCurrentObjectVersion(key);
  }

  /**
   * Retrieves a specific version of an object with metadata.
   * @param key - The key (path) of the object.
   * @param versionId - The version ID of the object.
   * @returns Promise resolving to object with buffer and metadata.
   */
  async getObjectVersionWithMetadata(key: string, versionId: string): Promise<{ buffer: Buffer, metadata: any }> {
    return this.storjService.getObjectVersionWithMetadata(key, versionId);
  }

  /**
   * Deletes an object by adding a delete marker.
   * @param key - The key (path) of the object.
   * @returns Promise resolving to the version ID of the delete marker.
   */
  async deleteObjectWithMarker(key: string): Promise<string | undefined> {
    return this.storjService.deleteObjectWithMarker(key);
  }

  /**
   * Undeletes an object by removing the delete marker.
   * @param key - The key (path) of the object.
   * @returns Promise resolving to the delete result.
   */
  async undeleteObject(key: string): Promise<any> {
    return this.storjService.undeleteObject(key);
  }


  /**
   * Lists all versions of a specific object in the bucket.
   * @param key - The key (path) of the object.
   * @returns Promise resolving to the list of object versions.
   */
  async listObjectVersionsForKey(key: string): Promise<any[]> {
    return this.storjService.listObjectVersionsForKey(key);
  }

  /**
   * Uploads a file to the bucket.
   * @param file - The file buffer to upload.
   * @param key - The key (path) for the file in the bucket.
   * @returns Promise resolving to the upload result.
   */
  async uploadFile(file: Buffer, key: string): Promise<any> {
    return this.storjService.uploadFile(file, key);
  }

  /**
   * Downloads the latest version of a file from the bucket.
   * @param key - The key (path) of the file to download.
   * @returns Promise resolving to the file buffer.
   */
  async downloadFile(key: string): Promise<Buffer> {
    return this.storjService.downloadFile(key);
  }
}