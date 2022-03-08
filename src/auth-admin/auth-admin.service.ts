import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';

import { CreateAdminDto, ResetPasswordDto } from './create-admin.dto';
import { Admin } from '../admin/admin.entity';
import { TokenPayload } from './token-payload.interface';

@Injectable()
export class AuthAdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  /**
   *
   * @param adminId
   * @returns string
   */
  public getCookieWithJwtAccessToken(adminId: number): any {
    const payload: TokenPayload = { adminId };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: `${this.configService.get(
        'JWT_ACCESS_TOKEN_EXPIRATION_TIME'
      )}s`,
    });

    return `access_token=${token}; Path=/; Domain=.x0x.io; SameSite=Lax; Max-Age=${this.configService.get(
      'JWT_ACCESS_TOKEN_EXPIRATION_TIME'
    )}`;
  }

  /**
   *
   * @param adminId
   * @returns object of cookie and token
   */
  public getCookieWithJwtRefreshToken(adminId: number): {
    token: string;
    cookie: string;
  } {
    const payload: TokenPayload = { adminId };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: `${this.configService.get(
        'JWT_REFRESH_TOKEN_EXPIRATION_TIME'
      )}s`,
    });
    const cookie = `refresh_token=${token}; Path=/; Domain=.x0x.io; SameSite=Lax; Max-Age=${this.configService.get(
      'JWT_REFRESH_TOKEN_EXPIRATION_TIME'
    )}`;
    return {
      cookie,
      token,
    };
  }

  public getCookiesForLogOut() {
    return [
      'access_token=; Path=/; Domain=.x0x.io; SameSite=Lax; Max-Age=0',
      'refresh_token=; Path=/; Domain=.x0x.io; SameSite=Lax; Max-Age=0',
    ];
  }

  async validateAdmin(email: string, password: string): Promise<any> {
    try {
      const admin = await this.adminRepository.findOne({ email });
      const match = await bcrypt.compare(password, admin.hash);
      if (admin && match) {
        const { hash, currentHashedRefreshToken, ...result } = admin;

        return result;
      }

      throw new HttpException(
        'Wrong credentials provided',
        HttpStatus.BAD_REQUEST
      );
    } catch (error) {
      throw new HttpException(
        'Wrong credentials provided',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async create(createAdminDto: CreateAdminDto): Promise<any> {
    try {
      const admin = new Admin();
      admin.firstName = createAdminDto.firstName;
      admin.lastName = createAdminDto.lastName;
      admin.email = createAdminDto.email;
      admin.username = createAdminDto.username;

      if (createAdminDto.password !== createAdminDto.confirmPassword) {
        throw new UnauthorizedException(
          'Password and confirm password does not match!'
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, adminCount] = await this.adminRepository.findAndCount({
        where: {
          email: createAdminDto.email,
        },
      });

      if (adminCount > 0) {
        throw new UnauthorizedException(
          'Duplicate email address, please use another valid email address!'
        );
      }

      // gen hash and salt
      const saltRounds = 10;
      const salt = await bcrypt.genSaltSync(saltRounds);
      const hash = await bcrypt.hashSync(createAdminDto.password, salt);
      admin.hash = hash;

      await this.adminRepository.save(admin);

      return {
        success: true,
        message: 'Create user admin successfully!',
        data: {},
      };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  /**
   * resetPassword
   * @description handle reset private key
   *
   * @param resetPasswordDto object with key `walletAddress` and new `privateKey`
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<any> {
    try {
      const admin = await this.adminRepository.findOne({
        email: resetPasswordDto.email,
      });
      const match = await bcrypt.compare(
        resetPasswordDto.oldPPassword,
        admin.hash
      );

      if (admin && match) {
        // gen hash and salt
        const saltRounds = 10;
        const salt = await bcrypt.genSaltSync(saltRounds);
        const hash = await bcrypt.hashSync(resetPasswordDto.newPassword, salt);

        await this.adminRepository.update(
          { email: resetPasswordDto.email },
          { hash }
        );

        return {
          success: true,
          message: 'Update password successfully',
          data: {},
        };
      } else {
        throw new UnauthorizedException('Wrong email password combination!');
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: {},
      };
    }
  }

  async getById(adminId): Promise<any> {
    try {
      const resp = await this.adminRepository.findOne({ id: adminId });

      if (!resp) {
        throw new UnauthorizedException();
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { hash, currentHashedRefreshToken, ...result } = resp;

      return new HttpException(
        {
          status: HttpStatus.OK,
          message: 'Success',
          data: result,
        },
        HttpStatus.OK
      );
    } catch (error) {
      throw error;
    }
  }
}
