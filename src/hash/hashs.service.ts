import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getConnection } from 'typeorm';
import { Between, Like, Not, IsNull } from 'typeorm';
import { CreateHashDto } from './create-hash.dto';
import { UpdateHashDto } from './update-hash.dto';
import { Hash } from './hashs.entity';
import { User } from '../users/users.entity';
import { Transaction } from '../transaction/transactions.entity';
import { FilterParams, SearchParams, PaginationParams } from './hash.dto';

@Injectable()
export class HashsService {
  constructor(
    @InjectRepository(Hash)
    private readonly hashsRepository: Repository<Hash>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>
  ) {}

  async getHashs(
    pagination: PaginationParams,
    filter: FilterParams,
    search: SearchParams
  ): Promise<any> {
    try {
      const { offset, limit, sort } = pagination;
      const { dateStart, dateEnd, packageId } = filter;
      const { walletAddress } = search;
      const order = sort === 'ASC' ? 1 : -1;
      const where: any = {};

      // if (packageId) {
      //   where.packageId = Number(packageId);
      // }

      if (dateStart) {
        where.createdAt = Between(
          new Date(dateStart),
          dateEnd ? new Date(dateEnd) : new Date()
        );
      }

      const [items, count] = await this.hashsRepository.findAndCount({
        relations: ['user'],
        join: {
          alias: 'transaction',
          innerJoin: { user: 'transaction.user' },
        },
        where: (qb) => {
          // filter field
          qb.where({
            ...where,
          });

          // filter related field
          if (walletAddress) {
            qb.andWhere('user.walletAddress like :walletAddress', {
              walletAddress: `%${walletAddress}%`,
            });
          }
        },
        order: {
          createdAt: order,
        },
        skip: offset || 0,
        take: limit || 10,
      });

      return {
        success: true,
        message: 'Data found',
        data: items,
        meta: { count, offset, limit },
      };
    } catch (e) {
      return e;
    }
  }

  updateFast(updateHashDto: UpdateHashDto): any {
    const status = updateHashDto.status;
    const hashTransaction = updateHashDto.hashTransaction;

    const data = getConnection()
      .createQueryBuilder()
      .update(Hash)
      .set({ status: status.toString() })
      .where('hashTransaction = :id', { id: hashTransaction })
      .execute();

    return {
      success: true,
      message: 'Updated',
      data,
    };
  }

  createFast(createHashDto: CreateHashDto): Promise<any> {
    try {
      const userId = createHashDto.userId;
      const userWallet = createHashDto.userWallet;
      const status = createHashDto.status;
      const hashTransaction = createHashDto.hashTransaction;
      const amount = createHashDto.amount;
      const hashRecord = new Hash();
      hashRecord.hashTransaction = hashTransaction;
      hashRecord.userId = userId;
      hashRecord.status = status;
      hashRecord.userWallet = userWallet;
      hashRecord.amount = amount;

      const hashObj = this.hashsRepository.save(hashRecord);
      return hashObj;
    } catch (error) {
      return error;
    }
  }

  async create(createHashDto: CreateHashDto): Promise<any> {
    try {
      const userId = createHashDto.userId;
      const userWallet = createHashDto.userWallet;
      const status = createHashDto.status;
      const hashTransaction = createHashDto.hashTransaction;

      const hashRecord = new Hash();
      hashRecord.hashTransaction = hashTransaction;
      hashRecord.userId = userId;
      hashRecord.status = status;
      hashRecord.userWallet = userWallet;

      const hashObj = await this.hashsRepository.save(hashRecord);

      //check if upgrade package, if true update user package to latest package
      if (hashObj.id > 0) {
        return {
          success: true,
          message: 'Data found',
          data: hashObj,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: [],
      };
    }
  }

  async getHashsByUserId(userId: number): Promise<any> {
    try {
      const listOfTransactions = await this.hashsRepository.find({
        where: { userId, status: 'pending' },
      });

      return {
        success: true,
        message: 'Data found',
        data: listOfTransactions,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: [],
      };
    }
  }
}
