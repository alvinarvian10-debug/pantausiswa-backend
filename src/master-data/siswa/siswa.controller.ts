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
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

import { Roles } from '../../common/decorators/roles.decorator';
import { SiswaService } from './siswa.service';
import { CreateSiswaDto, UpdateSiswaDto } from './dto';

export class QuerySiswaDto {
  @IsOptional() @Type(() => Number) @IsInt() page?: number;
  @IsOptional() @Type(() => Number) @IsInt() limit?: number;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @Type(() => Number) @IsInt() kelasId?: number;
}

@Controller('siswa')
export class SiswaController {
  constructor(private readonly service: SiswaService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateSiswaDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.GURU)
  findAll(@Query() query: QuerySiswaDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSiswaDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
