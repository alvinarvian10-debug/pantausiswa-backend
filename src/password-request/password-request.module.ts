import { Module } from '@nestjs/common';
import { PasswordRequestController } from './password-request.controller';
import { PasswordRequestService } from './password-request.service';

@Module({
  controllers: [PasswordRequestController],
  providers: [PasswordRequestService],
})
export class PasswordRequestModule {}
