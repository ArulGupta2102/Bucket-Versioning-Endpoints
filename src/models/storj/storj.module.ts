import { Module } from '@nestjs/common';
import { StorjService } from './storj.service';

@Module({
  providers: [StorjService],
  exports: [StorjService],
})
export class StorjModule {}