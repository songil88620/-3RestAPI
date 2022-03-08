import {
  Controller,
  Get,
  Query,
  UseGuards,
  Body,
  Post,
  Delete,
  Patch,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CreateSwapDto } from './create-swap-transaction.dto';
import { UpdateTransactionDto } from './create-transaction.dto';

import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaginationParams, FilterParams } from './transaction.dto';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  getTransactionList(
    @Query() { limit, offset, sort }: PaginationParams,
    @Query()
    { type, walletAddress, dateStart, dateEnd }: FilterParams
  ): Promise<any> {
    const queries = {
      filter: { type, walletAddress, dateStart, dateEnd },
      pagination: { limit, offset, sort },
    };

    if (walletAddress || type) {
      return this.transactionsService.search(queries);
    }
    return this.transactionsService.getAll(queries.pagination);
  }

  // @UseGuards(JwtAuthGuard)
  @Get('/transactionList')
  getTransactionsByUserId(
    @Query('userId') userId: number,
    @Query() { limit, offset, sort }: PaginationParams
  ): Promise<any> {
    const pagination = { limit, offset, sort };
    return this.transactionsService.getTransactionsByUserId(userId, pagination);
  }

  // @UseGuards(JwtAuthGuard)
  // @Post('/swap')
  // create(@Body() createSwapDto: CreateSwapDto): Promise<any> {
  //   return this.transactionsService.create(createSwapDto);
  // }

  @Patch('/update')
  update(@Body() updateTransactionDto: UpdateTransactionDto): Promise<any> {
    return this.transactionsService.update(updateTransactionDto);
  }

  @Delete('/delete')
  delete(@Body() id: number): Promise<any> {
    return this.transactionsService.delete(id);
  }

  // @UseGuards(JwtAuthGuard)
  @Get('/search')
  search(
    @Query() { limit = 10, offset = 0, sort = 'ASC' }: PaginationParams,
    @Query('q') q: string,
    @Query('userId') userId: number
  ): Promise<any> {
    const queries = {
      filter: { walletAddress: q, userId: userId },
      pagination: { limit, offset, sort },
    };

    return this.transactionsService.search(queries);
  }
}
