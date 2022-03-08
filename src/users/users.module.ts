import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User } from './users.entity';
import { Transaction } from './../transaction/transactions.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Transaction]), ConfigModule],
  providers: [UsersService, ConfigService],
  controllers: [UsersController],
})
export class UsersModule {}
