import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { CreateAdminDto } from './create-admin.dto';
import { Admin } from './admin.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly configService: ConfigService
  ) {}

  async setCurrentRefreshToken(refreshToken: string, adminId: number) {
    const currentHashedRefreshToken = await bcrypt.hashSync(refreshToken, 10);
    await this.adminRepository.update(
      { id: adminId },
      {
        currentHashedRefreshToken,
      }
    );
  }
  async getUserIfRefreshTokenMatches(refreshToken: string, adminId: number) {
    const admin = await this.adminRepository.findOne({ id: adminId });

    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      admin.currentHashedRefreshToken
    );

    if (!isRefreshTokenMatching) {
      throw new HttpException('Incorrect refresh token!', HttpStatus.FORBIDDEN);
    }

    const { hash, currentHashedRefreshToken, ...othrResult } = admin;

    return othrResult;
  }

  async removeRefreshToken(adminId: number) {
    return this.adminRepository.update(
      { id: adminId },
      {
        currentHashedRefreshToken: null,
      }
    );
  }

  /**
   *
   * @param createAdminDto
   * @returns
   */
  create(createAdminDto: CreateAdminDto): Promise<Admin> {
    const admin = new Admin();
    admin.firstName = createAdminDto.firstName;
    admin.lastName = createAdminDto.lastName;
    admin.username = createAdminDto.username;
    admin.email = createAdminDto.email;

    return this.adminRepository.save(admin);
  }

  /**
   * getById
   * @param adminId
   * @returns
   */
  async getById(adminId: number): Promise<any> {
    try {
      const admin = await this.adminRepository.findOne({
        id: adminId,
      });

      if (admin) {
        const { hash, currentHashedRefreshToken, ...data } = admin;
        return data;
      }

      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw error;
    }
  }
}
