import {
  HttpException,
  Injectable,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as ethUtils from 'ethereumjs-util';
import Web3 from 'web3';

import { RegisterDto } from './dto/register.dto';
import { User } from './../users/users.entity';
import { Helpers } from '../helpers';
import { TokenPayload } from './interfaces/tokenPayload.interface';
import { LoginDto } from './dto/login.dto';

const MESSAGE_DATA = 'Sign this message!';
export const FROM_ADDRESS = '0x467aC5BA181b7ef22c654C5523B32B765443ac5E';
export const WEB3_PRIVATE_KEY =
  'fad8ab106cbd48a943994beeacc89c206b00a31fb7ac58263e8b589fc4aa6236';
export const RPC_URL_1 =
  'https://mainnet.infura.io/v3/84842078b09946638c03157f83405213';
export const RPC_URL_4 =
  'https://rinkeby.infura.io/v3/84842078b09946638c03157f83405213';

const RPC_URLS: { [chainId: number]: string } = {
  1: RPC_URL_1 as string,
  4: RPC_URL_4 as string,
};

const chainId = process.env.NODE_ENV === 'production' ? 1 : 4;

@Injectable()
export class AuthService {
  private web3;
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    this.web3 = new Web3(new Web3.providers.HttpProvider(RPC_URLS[chainId]));
  }

  /**
   *
   * @param userId
   * @returns string
   */
  public getCookieWithJwtAccessToken(userId: number): any {
    const payload: TokenPayload = { userId };
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
   * @param userId
   * @returns object of cookie and token
   */
  public getCookieWithJwtRefreshToken(userId: number): {
    token: string;
    cookie: string;
  } {
    const payload: TokenPayload = { userId };
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

  async checkDuplicateReferralCode(): Promise<string> {
    try {
      let referralCode = new Helpers().generateReferralCode();
      const [_, userCount] = await this.usersRepository.findAndCount({
        where: {
          referralCode,
        },
      });

      if (userCount > 0) {
        referralCode = new Helpers().generateReferralCode();
      }

      return referralCode;
    } catch (error) {
      throw new Error('Somethings went wrong when generate referral code');
    }
  }

  async register(registerDto: RegisterDto): Promise<any> {
    try {
      const user = new User();
      user.walletAddress = registerDto.walletAddress;

      const [_, userWalletCount] = await this.usersRepository.findAndCount({
        where: {
          walletAddress: registerDto.walletAddress,
        },
      });

      if (userWalletCount > 0) {
        throw new UnauthorizedException('wallet address already registered');
      }
      let refUser;
      // check owner referralCode
      if (registerDto.referralCode) {
        const [referralUser, referralUserCount] =
          await this.usersRepository.findAndCount({
            where: {
              referralCode: registerDto.referralCode,
            },
          });

        if (referralUserCount > 0) {
          user.sponsorId = referralUser[0].id;

          //find the postion of the number line at where
          user.sponsorerLine = referralUser[0].numberOfLine + 1;
          //add the upline
          user.totalUplineString =
            referralUser[0].totalUplineString + ',' + referralUser[0].id;
          //update the referral numberofline +1;
          referralUser[0].numberOfLine = referralUser[0].numberOfLine + 1;
          refUser = referralUser[0];
        }
      }

      user.referralCode = await this.checkDuplicateReferralCode();

      const userResp = await this.usersRepository.save(user);
      const resp = await this.usersRepository.update(
        { id: refUser.id },
        {
          numberOfLine: refUser.numberOfLine,
        }
      );
      return {
        success: true,
        message: 'Account registered',
        data: userResp,
      };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  /**
   * validateSignature
   * @param sig
   * @param accountAddress
   * @returns string account address
   * @description custom validation signature
   */
  async validateSignature(sig) {
    try {
      const msg = await this.web3.utils.sha3(MESSAGE_DATA);
      const signature = ethUtils.fromRpcSig(sig);
      const pubKey = ethUtils.ecrecover(
        msg,
        signature.v,
        signature.r,
        signature.s
      );
      const foundAddress = '0x' + ethUtils.pubToAddress(pubKey).toString('hex');

      return foundAddress;
    } catch (error) {
      return undefined;
    }
  }

  async login(loginDto: LoginDto): Promise<any> {
    const { accountAddress, signature } = loginDto;
    let recoveredAddress;
    try {
      recoveredAddress = this.web3.eth.accounts.recover(
        MESSAGE_DATA,
        signature
      );
    } catch (error) {
      throw new HttpException('Problem with signature verification.', 403);
    }

    // TODO: 1). can input sign message and compare it with sign message on database. 2). save sign message to database when register
    if (recoveredAddress.toLowerCase() !== accountAddress.toLowerCase()) {
      throw new HttpException('Signature is not correct.', 400);
    }

    try {
      const existUser = await this.usersRepository.findOne({
        walletAddress: accountAddress,
      });

      if (!existUser) {
        throw new HttpException(
          'Wallet address not registered!',
          HttpStatus.BAD_REQUEST
        );
      }

      const { hash, ...otherResult } = existUser;

      return otherResult;
    } catch (error) {
      throw error;
    }
  }

  async getById(userId): Promise<any> {
    try {
      const resp = await this.usersRepository.findOne({ id: userId });

      if (!resp) {
        return new UnauthorizedException();
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
