import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getConnection, Between, Like } from 'typeorm';
import { CreateSwapDto } from './create-swap-transaction.dto';
import { UpdateTransactionDto } from './create-transaction.dto';
import {
  PaginationParams,
  FilterParams,
  SearchParams,
} from './transaction.dto';
import { Transaction } from './transactions.entity';
import { User } from './../users/users.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>
  ) {}

  async getTransactions(
    pagination: PaginationParams,
    filter: FilterParams,
    search: SearchParams
  ): Promise<any> {
    try {
      const { offset, limit, sort } = pagination;
      const { type, dateStart, dateEnd } = filter;
      const { walletAddress } = search;
      const order = sort === 'ASC' ? 1 : -1;
      const where: any = {};

      if (type) {
        where.type = type;
      }

      if (dateStart) {
        where.createdAt = Between(
          new Date(dateStart),
          dateEnd ? new Date(dateEnd) : new Date()
        );
      }

      const [items, count] = await this.transactionsRepository.findAndCount({
        relations: ['user'],
        where,
        order: {
          createdAt: order,
        },
        skip: offset || 0,
        take: limit || 10,
      });

      const data = await Promise.all(
        items.map(async (item) => {
          const user = await getConnection()
            .createQueryBuilder()
            .select('user')
            .from(User, 'user')
            .where('user.id = :id', { id: item.userId })
            .getOne();

          return {
            ...item,
            fromWalletAddress: user?.walletAddress,
          };
        })
      );
      return {
        success: true,
        message: 'Data found',
        data: data,
        meta: { count, offset, limit },
      };
    } catch (e) {
      return e;
    }
  }

  async delete(id: any): Promise<any> {
    try {
      const transaction = await this.transactionsRepository.findOne({
        where: { id: id.id },
      });

      await this.transactionsRepository.remove(transaction);

      return {
        success: true,
        message: 'Successfully Deleted.',
      };
    } catch (e) {
      if (e.name === 'MustBeEntityError') {
        return {
          success: false,
          message: 'No transaction found.',
        };
      } else {
        return e;
      }
    }
  }

  async update(updateTransactionDto: UpdateTransactionDto): Promise<any> {
    try {
      const result = await getConnection()
        .createQueryBuilder()
        .update(Transaction)
        .set({
          description: updateTransactionDto.description,
          type: updateTransactionDto.type,
          userId: updateTransactionDto.userId,
          amount: updateTransactionDto.amount,
          createdAt: updateTransactionDto.createdAt,
          toWalletAddress: updateTransactionDto.toWalletAddress,
        })
        .where('id = :id', { id: updateTransactionDto.id })
        .execute();

      return {
        success: true,
        message: 'Transaction Updated',
        data: updateTransactionDto,
      };
    } catch (e) {
      return {
        success: false,
        message: 'Update Failed',
        data: {},
      };
    }
  }

  async getAll(queries: PaginationParams): Promise<any> {
    try {
      const { offset, limit, sort } = queries;
      const order = sort === 'ASC' ? 1 : -1;
      const [items, count] = await this.transactionsRepository.findAndCount({
        relations: ['user'],
        order: {
          createdAt: order,
        },
        skip: offset || 1,
        take: limit || 10,
      });

      return {
        success: true,
        message: 'Data found',
        data: items,
        meta: { count, offset, limit },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: [],
        meta: {},
      };
    }
  }

  async search(filters: {
    filter: FilterParams;
    pagination: PaginationParams;
  }): Promise<any> {
    try {
      const {
        filter: { type, walletAddress, dateStart, dateEnd, userId },
        pagination: { offset, limit, sort },
      } = filters;
      const order = sort === 'ASC' ? 1 : -1;
      const where: any = {};

      if (type) {
        where.type = type;
      }

      if (userId) {
        where.userId = userId;
      }

      if (dateStart) {
        where.createdAt = Between(
          new Date(dateStart),
          dateEnd ? new Date(dateEnd) : new Date()
        );
      }

      const [items, count] = await this.transactionsRepository.findAndCount({
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
    } catch (error) {
      return {
        success: false,
        message: 'Error',
        data: [],
        meta: {},
      };
    }
  }

  async getTransactionsByUserId(
    userId: number,
    pagination: PaginationParams
  ): Promise<any> {
    try {
      const { offset, limit, sort } = pagination;
      const order = sort === 'ASC' ? 1 : -1;

      const [items, count] = await this.transactionsRepository.findAndCount({
        where: { userId },
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
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: [],
      };
    }
  }
}
