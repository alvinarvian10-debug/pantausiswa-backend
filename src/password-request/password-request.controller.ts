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
import { Role } from '@prisma/client';

import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PasswordRequestService } from './password-request.service';
import { CreatePasswordRequestDto, ReviewPasswordRequestDto } from './dto';

@Controller('password-requests')
export class PasswordRequestController {
  constructor(private readonly service: PasswordRequestService) {}

  /** Sekretaris mengajukan password baru. */
  @Post()
  @Roles(Role.SEKRETARIS)
  create(
    @CurrentUser('userId') userId: number,
    @Body() dto: CreatePasswordRequestDto,
  ) {
    return this.service.create(userId, dto.newPassword);
  }

  /** Riwayat permintaan milik sendiri. */
  @Get('me')
  @Roles(Role.SEKRETARIS)
  mine(@CurrentUser('userId') userId: number) {
    return this.service.myRequests(userId);
  }

  /** Semua permintaan (admin). */
  @Get()
  @Roles(Role.ADMIN)
  findAll(@Query('status') status?: string) {
    return this.service.findAll(status);
  }

  /** Admin setujui/tolak. */
  @Patch(':id/review')
  @Roles(Role.ADMIN)
  review(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') reviewerId: number,
    @Body() dto: ReviewPasswordRequestDto,
  ) {
    return this.service.review(id, reviewerId, dto);
  }
}
