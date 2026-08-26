import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AduanService } from './aduan.service';
import { CreateAduanDto, UpdateAduanDto } from './dto';

export class QueryListDto {
  @IsOptional() @Type(() => Number) @IsInt() page?: number;
  @IsOptional() @Type(() => Number) @IsInt() limit?: number;
  @IsOptional() status?: string;
  @IsOptional() prioritas?: string;
}

@Controller('aduan')
export class AduanController {
  constructor(private readonly service: AduanService) {}

  /** Buat tiket aduan (semua role bisa) */
  @Post()
  create(@CurrentUser('userId') userId: number, @Body() dto: CreateAduanDto) {
    return this.service.create(userId, dto);
  }

  /** Tiket milik saya */
  @Get('me')
  myTickets(@CurrentUser('userId') userId: number, @Query() q: QueryListDto) {
    return this.service.myTickets(userId, q);
  }

  /** Semua tiket (admin) */
  @Get()
  @Roles('ADMIN')
  findAll(@Query() query: QueryListDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  /** Admin tangani tiket */
  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
    @Body() dto: UpdateAduanDto,
  ) {
    return this.service.update(id, userId, dto);
  }
}
