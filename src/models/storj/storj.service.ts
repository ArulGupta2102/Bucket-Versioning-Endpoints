import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, ListObjectVersionsCommand, DeleteObjectCommand, GetBucketVersioningCommand } from '@aws-sdk/client-s3';

/**
 * StorjService provides methods to interact with Storj using S3-compatible API.
 */
@Injectable()
export class StorjService {
  private readonly logger = new Logger(StorjService.name);
  private s3Client: S3Client;
  private bucket = this.configService.get<string>('STORJ_BUCKET');


  constructor(private configService: ConfigService) {
    const accessKey = this.configService.get<string>('STORJ_ACCESS_KEY');
    const secretKey = this.configService.get<string>('STORJ_SECRET_KEY');
    const endpoint = this.configService.get<string>('STORJ_ENDPOINT');

    if (!accessKey || !secretKey || !endpoint) {
      this.logger.error('Storj configuration is incomplete');
      throw new Error('Storj configuration is incomplete');
    }

    this.logger.log('Initializing Storj S3 client');
    this.s3Client = new S3Client({
      region: 'us-east-1', // Storj doesn't require a specific region, but AWS SDK needs one
      endpoint,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true, // Required for Storj
    });
  }

  private streamToBuffer(stream: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: any[] = [];
      stream.on('data', (chunk: any) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
  /**
   * Uploads a file to Storj.
   * @param file - The file buffer to upload.
   * @param key - The key (path) for the file in the bucket.
   * @returns Promise resolving to the upload result.
   */
  async uploadFile(file: Buffer, key: string): Promise<any> {
    this.logger.log(`Uploading file to key: ${key}`);
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
      });
      const result = await this.s3Client.send(command);
      this.logger.log(`Successfully uploaded file to key: ${key}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to upload file to key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Downloads a file from Storj.
   * @param key - The key (path) of the file to download.
   * @returns Promise resolving to the file buffer.
   */
  async downloadFile(key: string): Promise<Buffer> {
    this.logger.log(`Downloading file from key: ${key}`);
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const response = await this.s3Client.send(command);
      const streamToBuffer = (stream: any): Promise<Buffer> => {
        return new Promise((resolve, reject) => {
          const chunks: any[] = [];
          stream.on('data', (chunk: any) => chunks.push(chunk));
          stream.on('error', reject);
          stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
      };
      const buffer = await streamToBuffer(response.Body);
      this.logger.log(`Successfully downloaded file from key: ${key}`);
      return buffer;
    } catch (error) {
      this.logger.error(`Failed to download file from key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Lists objects in the Storj bucket.
   * @returns Promise resolving to the list of objects.
   */
  async listObjects(): Promise<any[]> {
    this.logger.log('Listing objects in bucket');
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
      });
      const response = await this.s3Client.send(command);
      this.logger.log(`Found ${response.Contents?.length || 0} objects in bucket`);
      return response.Contents || [];
    } catch (error) {
      this.logger.error('Failed to list objects in bucket', error);
      throw error;
    }
  }

  /**
   * Lists all versions of objects in the Storj bucket.
   * @returns Promise resolving to the list of object versions.
   */
  async listObjectVersions(): Promise<any[]> {
    this.logger.log('Listing all object versions in bucket');
    try {
      const command = new ListObjectVersionsCommand({
        Bucket: this.bucket,
      });
      const response = await this.s3Client.send(command);
      this.logger.log(`Found ${response.Versions?.length || 0} object versions in bucket`);
      return response.Versions || [];
    } catch (error) {
      this.logger.error('Failed to list object versions in bucket', error);
      throw error;
    }
  }

  /**
   * Downloads a specific version of a file from Storj.
   * @param key - The key (path) of the file.
   * @param versionId - The version ID of the file.
   * @returns Promise resolving to the file buffer.
   */
  async getObjectVersion(key: string, versionId: string): Promise<Buffer> {
    this.logger.log(`Downloading object version for key: ${key}, versionId: ${versionId}`);
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        VersionId: versionId,
      });
      const response = await this.s3Client.send(command);
      const streamToBuffer = (stream: any): Promise<Buffer> => {
        return new Promise((resolve, reject) => {
          const chunks: any[] = [];
          stream.on('data', (chunk: any) => chunks.push(chunk));
          stream.on('error', reject);
          stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
      };
      const buffer = await streamToBuffer(response.Body);
      this.logger.log(`Successfully downloaded object version for key: ${key}, versionId: ${versionId}`);
      return buffer;
    } catch (error) {
      this.logger.error(`Failed to download object version for key: ${key}, versionId: ${versionId}`, error);
      throw error;
    }
  }

  /**
   * Deletes a specific version of an object from Storj.
   * @param key - The key (path) of the object.
   * @param versionId - The version ID of the object to delete.
   * @returns Promise resolving to the delete result.
   */
  async deleteObjectVersion(key: string, versionId: string): Promise<any> {
    this.logger.log(`Deleting object version for key: ${key}, versionId: ${versionId}`);
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
        VersionId: versionId,
      });
      const result = await this.s3Client.send(command);
      this.logger.log(`Successfully deleted object version for key: ${key}, versionId: ${versionId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to delete object version for key: ${key}, versionId: ${versionId}`, error);
      throw error;
    }
  }

  /**
   * Checks if versioning is enabled for the Storj bucket.
   * @returns Promise resolving to true if versioning is enabled, false otherwise.
   */
  async isVersioningEnabled(): Promise<boolean> {
    this.logger.log('Checking if versioning is enabled for bucket');
    try {
      const command = new GetBucketVersioningCommand({
        Bucket: this.bucket,
      });
      const response = await this.s3Client.send(command);
      const isEnabled = response.Status === 'Enabled';
      this.logger.log(`Versioning is ${isEnabled ? 'enabled' : 'disabled'} for bucket`);
      return isEnabled;
    } catch (error) {
      this.logger.error('Failed to check versioning status for bucket', error);
      throw error;
    }
  }
  /**
   * Lists all versions of a specific object in the Storj bucket.
   * @param key - The key (path) of the object.
   * @returns Promise resolving to the list of object versions.
   */
  async listObjectVersionsForKey(key: string): Promise<any[]> {
    this.logger.log(`Listing object versions for key: ${key}`);
    try {
      const command = new ListObjectVersionsCommand({
        Bucket: this.bucket,
        Prefix: key,
      });
      const response = await this.s3Client.send(command);
      // Combine Versions and DeleteMarkers arrays and sort by LastModified in descending order
      this.logger.log(response)
      const allVersions = [
        ...(response.Versions || []),
        ...(response.DeleteMarkers || [])
      ].sort((a, b) => {
        const dateA = a.LastModified ? new Date(a.LastModified).getTime() : 0;
        const dateB = b.LastModified ? new Date(b.LastModified).getTime() : 0;
        return dateB - dateA;
      });
      this.logger.log(`Found ${allVersions.length} versions/markers for key: ${key}`);
      return allVersions;
    } catch (error) {
      this.logger.error(`Failed to list object versions for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Retrieves the current (latest) version of an object with metadata.
   * @param key - The key (path) of the object.
   * @returns Promise resolving to object with buffer and metadata.
   */
  async getCurrentObjectVersion(key: string): Promise<{ buffer: Buffer, metadata: any }> {
    this.logger.log(`Retrieving current object version for key: ${key}`);
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const response = await this.s3Client.send(command);
      const buffer = await this.streamToBuffer(response.Body);
      this.logger.log(`Successfully retrieved current object version for key: ${key}`);
      return { buffer, metadata: response.Metadata };
    } catch (error) {
      this.logger.error(`Failed to retrieve current object version for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Retrieves a specific version of an object with metadata.
   * @param key - The key (path) of the object.
   * @param versionId - The version ID of the object.
   * @returns Promise resolving to object with buffer and metadata.
   */
  async getObjectVersionWithMetadata(key: string, versionId: string): Promise<{ buffer: Buffer, metadata: any }> {
    this.logger.log(`Retrieving object version with metadata for key: ${key}, versionId: ${versionId}`);
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        VersionId: versionId,
      });
      const response = await this.s3Client.send(command);
      const buffer = await this.streamToBuffer(response.Body);
      this.logger.log(`Successfully retrieved object version with metadata for key: ${key}, versionId: ${versionId}`);
      return { buffer, metadata: response.Metadata };
    } catch (error) {
      this.logger.error(`Failed to retrieve object version with metadata for key: ${key}, versionId: ${versionId}`, error);
      throw error;
    }
  }

  /**
   * Deletes an object by adding a delete marker.
   * @param key - The key (path) of the object.
   * @returns Promise resolving to the version ID of the delete marker.
   */
  async deleteObjectWithMarker(key: string): Promise<string | undefined> {
    this.logger.log(`Deleting object with marker for key: ${key}`);
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const response = await this.s3Client.send(command);
      this.logger.log(`Successfully deleted object with marker for key: ${key}, marker versionId: ${response.VersionId}`);
      return response.VersionId;
    } catch (error) {
      this.logger.error(`Failed to delete object with marker for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Undeletes an object by removing the delete marker.
   * @param key - The key (path) of the object.
   * @returns Promise resolving to the delete result.
   */
  async undeleteObject(key: string): Promise<any> {
    this.logger.log(`Undeleting object for key: ${key}`);
    try {
      const versions = await this.listObjectVersionsForKey(key);
      const deleteMarkers = versions.filter(v => v.IsDeleteMarker && v.Key === key);
      if (deleteMarkers.length === 0) {
        this.logger.warn(`No delete marker found for key: ${key}`);
        throw new Error('No delete marker found for the object');
      }
      // Sort by LastModified descending to get the most recent delete marker
      const latestDeleteMarker = deleteMarkers.sort((a, b) => new Date(b.LastModified).getTime() - new Date(a.LastModified).getTime())[0];
      this.logger.log(`Found ${deleteMarkers.length} delete markers, removing latest one with versionId: ${latestDeleteMarker.VersionId}`);
      const result = await this.deleteObjectVersion(key, latestDeleteMarker.VersionId);
      this.logger.log(`Successfully undeleted object for key: ${key}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to undelete object for key: ${key}`, error);
      throw error;
    }
  }

}