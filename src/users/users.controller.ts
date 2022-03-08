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

import { TransferUserDto } from './transfer-users.dto';
import { User } from './users.entity';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  IFilterParams,
  IPaginationParams,
  IUserId,
  IWalletAddress,
} from './interfaces/params.interface';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/transfer')
  transfer(@Body() transferUserDto: TransferUserDto): Promise<User> {
    return this.usersService.transfer(transferUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/sponsorList')
  getUsersDirectSponsor(@Query('sponsorId') sponsorId: number): Promise<any> {
    return this.usersService.getUsersDirectSponsor(sponsorId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/account')
  getAccountInfo(
    @Request() request: any,
    @Query('walletAddress') walletAddress: string
  ): Promise<any> {
    return this.usersService.getAccountInfo(walletAddress);
  }
  @UseGuards(JwtAuthGuard)
  @Get('/userDetails')
  getUserDashboard(
    @Query('walletAddress') walletAddress: string
  ): Promise<any> {
    return this.usersService.getUserDashboard(walletAddress);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/totalSponsorUsers')
  countReferralById(@Query('id') id: number): Promise<any> {
    return this.usersService.countReferralById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/user')
  getUserbyId(@Query('id') id: number): Promise<any> {
    return this.usersService.getUserbyId(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/totalusers')
  getTotalUsers(
    @Query('id') id: number,
    @Query('limit') limit: any,
    @Query('q') q: string
  ): Promise<any> {
    const query = { id, limit, q };
    return this.usersService.getTotalUsers(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/totalusers/count')
  getUserCount(@Query('id') id: number): Promise<any> {
    return this.usersService.getUserCount(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/status/transfer')
  getUserTransferStatus(@Query('id') id: number): Promise<any> {
    return this.usersService.getUserTransferStatus(id);
  }

  /**
   * updateUser by userId
   * @param param
   * @returns
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':userId')
  updateUser(
    @Param() { userId }: IUserId,
    @Body() userData: User
  ): Promise<any> {
    return this.usersService.updateUser(userId, userData);
  }

  //@UseGuards(JwtAuthGuard)
  @Get('/walletAddress/:walletAddress')
  getByWalletAddress(@Param() { walletAddress }: IWalletAddress): Promise<any> {
    return this.usersService.getByWalletAddress(walletAddress);
  }

  //@UseGuards(JwtAuthGuard)
  @Post('/createTransactionM')
  createTransactioM(
    @Query('userId') userId: string,
    @Query('usdtAmount') usdtAmount: string
  ): Promise<any> {
    return this.usersService.createTransactionMM(userId, usdtAmount);
  }

  //@UseGuards(JwtAuthGuard)
  @Post('/getTotalCommunityMLONPurchased')
  getTotalCommunityMLONPurchased(
    @Query('userId') userId: number
  ): Promise<any> {
    return this.usersService.getTotalCommunityMLONPurchased(userId);
  }

  //@UseGuards(JwtAuthGuard)
  @Post('/getTotalCommunityUSDTSpend')
  getTotalCommunityUSDTSpend(@Query('userId') userId: number): Promise<any> {
    return this.usersService.getTotalCommunityUSDTSpend(userId);
  }

  @Post('/checkReferralCode')
  checkReferralCode(@Query('refCode') refCode: string): Promise<any> {
    return this.usersService.checkReferralCode(refCode);
  }
}
