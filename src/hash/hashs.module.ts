import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Hash } from './hashs.entity';
import { HashsController } from './hash.controller';
import { HashsService } from './hashs.service';
import { Transaction } from './../transaction/transactions.entity';
import { User } from './../users/users.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Hash, Transaction, User])],
  providers: [HashsService],
  controllers: [HashsController],
})
export class HashsModule {}
