import { Module } from '@nestjs/common';
import { AduanController } from './aduan.controller';
import { AduanService } from './aduan.service';

@Module({
  controllers: [AduanController],
  providers: [AduanService],
})
export class AduanModule {}
