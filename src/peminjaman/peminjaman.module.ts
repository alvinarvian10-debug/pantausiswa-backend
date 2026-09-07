import { Module } from '@nestjs/common';
import { PeminjamanController } from './peminjaman.controller';
import { PeminjamanService } from './peminjaman.service';

@Module({
  controllers: [PeminjamanController],
  providers: [PeminjamanService],
})
export class PeminjamanModule {}
