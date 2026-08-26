import { Module } from '@nestjs/common';
import { GuruController } from './guru.controller';
import { GuruService } from './guru.service';

@Module({
  controllers: [GuruController],
  providers: [GuruService],
})
export class GuruModule {}
