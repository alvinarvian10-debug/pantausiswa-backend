import { Module } from '@nestjs/common';
import { PengaturanController } from './pengaturan.controller';
import { PengaturanService } from './pengaturan.service';

@Module({
  controllers: [PengaturanController],
  providers: [PengaturanService],
})
export class PengaturanModule {}
