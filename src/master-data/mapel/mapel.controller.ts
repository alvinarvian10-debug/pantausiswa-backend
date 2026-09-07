import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { Roles } from '../../common/decorators/roles.decorator';
import { MapelService } from './mapel.service';
import { CreateMapelDto, UpdateMapelDto } from './dto';

@Controller('mapel')
export class MapelController {
  constructor(private readonly service: MapelService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateMapelDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.GURU)
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMapelDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
