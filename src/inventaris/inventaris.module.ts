import { Module } from '@nestjs/common';
import { InventarisController } from './inventaris.controller';
import { InventarisService } from './inventaris.service';

@Module({
  controllers: [InventarisController],
  providers: [InventarisService],
})
export class InventarisModule {}
