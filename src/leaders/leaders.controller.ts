import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Param,
  Patch,
  Request,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Leader } from './leaders.entity';
import { LeadersService } from './leaders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
export class LeadersController {
  constructor(private readonly leadersService: LeadersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/user')
  getUserbyId(@Query('userId') id: number): Promise<any> {
    return this.leadersService.getLeadershipPowerId(id);
  }
}
