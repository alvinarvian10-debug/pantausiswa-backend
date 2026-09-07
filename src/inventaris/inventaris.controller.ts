import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { Roles } from '../common/decorators/roles.decorator';
import { InventarisService } from './inventaris.service';
import { CreateBarangDto, UpdateBarangDto } from './dto';

@Controller('barang')
export class InventarisController {
  constructor(private readonly service: InventarisService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateBarangDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('search') search?: string, @Query('kategori') kategori?: string) {
    return this.service.findAll({ search, kategori });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBarangDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
