import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';

import { AnalitikService } from './analitik.service';

@Controller('analitik')
@Roles('ADMIN', 'GURU')
export class AnalitikController {
  constructor(private readonly service: AnalitikService) {}

  @Get('ringkasan')
  ringkasan() {
    return this.service.ringkasan();
  }

  @Get('kehadiran-tren')
  trenKehadiran(@Query('days') days?: string) {
    return this.service.trenKehadiran(Number(days) || 14);
  }

  @Get('per-kelas')
  perKelas(@Query('tanggal') tanggal?: string) {
    return this.service.perKelas(tanggal);
  }

  @Get('aduan-status')
  distribusiAduan() {
    return this.service.distribusiAduan();
  }

  @Get('tugas')
  statistikTugas() {
    return this.service.statistikTugas();
  }

  @Get('nilai')
  statistikNilai() {
    return this.service.statistikNilai();
  }
}
