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
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

import { Roles } from '../../common/decorators/roles.decorator';
import { GuruService } from './guru.service';
import { CreateGuruDto, UpdateGuruDto } from './dto';

export class QueryGuruDto {
  @IsOptional() @Type(() => Number) @IsInt() page?: number;
  @IsOptional() @Type(() => Number) @IsInt() limit?: number;
  @IsOptional() @IsString() search?: string;
}

@Controller('guru')
export class GuruController {
  constructor(private readonly service: GuruService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateGuruDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.GURU)
  findAll(@Query() query: QueryGuruDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGuruDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
