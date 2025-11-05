import { Module } from '@nestjs/common';
import { BucketVersioningController } from './bucket-versioning.controller';
import { BucketVersioningService } from './bucket-versioning.service';
import { StorjModule } from '../storj/storj.module';

/**
 * BucketVersioningModule provides bucket versioning functionality.
 */
@Module({
  imports: [StorjModule],
  controllers: [BucketVersioningController],
  providers: [BucketVersioningService],
  exports: [BucketVersioningService],
})
export class BucketVersioningModule {}