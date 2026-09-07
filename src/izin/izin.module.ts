import { Module } from '@nestjs/common';
import { IzinController } from './izin.controller';
import { IzinService } from './izin.service';

@Module({
  controllers: [IzinController],
  providers: [IzinService],
})
export class IzinModule {}
