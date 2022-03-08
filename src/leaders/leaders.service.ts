import {
  Injectable,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, getConnection, getRepository, Like } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { Leader } from './leaders.entity';

import { default as dayjs } from 'dayjs';

@Injectable()
export class LeadersService {
  constructor(
    @InjectRepository(Leader)
    private readonly leadersRepository: Repository<Leader>
  ) {}

  async getLeadershipPowerId(userId: number): Promise<any> {
    try {
      const [items, count] = await this.leadersRepository.findAndCount({
        where: { userId },
      });

      return {
        success: true,
        message: 'Data found',
        data: items,
        // meta: count
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
