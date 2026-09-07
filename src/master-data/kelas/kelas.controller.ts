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
import { IsOptional, IsString } from 'class-validator';

import { Roles } from '../../common/decorators/roles.decorator';
import { KelasService } from './kelas.service';
import { CreateKelasDto, UpdateKelasDto } from './dto';

export class QueryKelasDto {
  @IsOptional() @IsString() search?: string;
}

@Controller('kelas')
export class KelasController {
  constructor(private readonly service: KelasService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateKelasDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.GURU)
  findAll(@Query() query: QueryKelasDto) {
    return this.service.findAll(query.search);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateKelasDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
