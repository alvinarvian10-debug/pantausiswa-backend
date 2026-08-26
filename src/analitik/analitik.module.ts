import { Module } from '@nestjs/common';
import { AnalitikController } from './analitik.controller';
import { AnalitikService } from './analitik.service';

@Module({
  controllers: [AnalitikController],
  providers: [AnalitikService],
})
export class AnalitikModule {}
