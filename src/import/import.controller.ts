import { Body, Controller, Post } from '@nestjs/common';
import { Role } from '@prisma/client';

import { Roles } from '../common/decorators/roles.decorator';
import { ImportService } from './import.service';
import { ImportGuruDto, ImportSiswaDto } from './dto';

@Controller('import')
export class ImportController {
  constructor(private readonly service: ImportService) {}

  /** Impor massal siswa dari Excel yang sudah diparsing frontend. */
  @Post('siswa')
  @Roles(Role.ADMIN)
  importSiswa(@Body() dto: ImportSiswaDto) {
    return this.service.importSiswa(dto);
  }

  /** Impor massal guru dari Excel yang sudah diparsing frontend. */
  @Post('guru')
  @Roles(Role.ADMIN)
  importGuru(@Body() dto: ImportGuruDto) {
    return this.service.importGuru(dto);
  }
}
