import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Role } from '@prisma/client';

import { Roles } from '../common/decorators/roles.decorator';
import { PengaturanService } from './pengaturan.service';
import { UpdatePengaturanDto } from './dto';

@Controller('pengaturan')
export class PengaturanController {
  constructor(private readonly service: PengaturanService) {}

  /** Profil sekolah (semua role login bisa baca). */
  @Get()
  get() {
    return this.service.get();
  }

  /** Admin ubah profil/pengaturan sekolah. */
  @Patch()
  @Roles(Role.ADMIN)
  update(@Body() dto: UpdatePengaturanDto) {
    return this.service.update(dto);
  }
}
