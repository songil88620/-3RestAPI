import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CreateHashDto } from './create-hash.dto';
import { UpdateHashDto } from './update-hash.dto';
import { HashsService } from './hashs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilterParams, SearchParams, PaginationParams } from './hash.dto';

@ApiTags('hashs')
@Controller('hashs')
export class HashsController {
  constructor(private readonly hashsService: HashsService) {}

  @Get('/')
  getHashs(
    @Query() { limit, offset, sort }: PaginationParams,
    @Query() { dateStart, dateEnd, packageId }: FilterParams,
    @Query() { walletAddress }: SearchParams
  ): Promise<any> {
    const pagination = { limit, offset, sort };
    const filter = { dateStart, dateEnd, packageId };
    const search = { walletAddress };

    return this.hashsService.getHashs(pagination, filter, search);
  }

  // @UseGuards(JwtAuthGuard)
  @Get('/hashListByUserId')
  getUsersDirectSponsor(@Query('userId') userId: number): Promise<any> {
    return this.hashsService.getHashsByUserId(userId);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/create')
  create(@Body() createHashDto: CreateHashDto): Promise<any> {
    return this.hashsService.create(createHashDto);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/createFast')
  createFast(@Body() createHashDto: CreateHashDto): Promise<any> {
    return this.hashsService.createFast(createHashDto);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/updateFast')
  updateFast(@Body() updateHashDto: UpdateHashDto): Promise<any> {
    return this.hashsService.updateFast(updateHashDto);
  }
}
