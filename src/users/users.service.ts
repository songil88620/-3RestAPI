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
import xl from 'excel4node';
import * as fs from 'fs';
import * as AWS from 'aws-sdk';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

import { CreateUserDto } from './create-user.dto';
import { TransferUserDto } from './transfer-users.dto';
import {
  IFilterParams,
  IPaginationParams,
} from './interfaces/params.interface';
import { User } from './users.entity';
import { Transaction } from './../transaction/transactions.entity';

import { default as dayjs } from 'dayjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    private readonly configService: ConfigService
  ) {}

  async getById(userId: number): Promise<any> {
    try {
      const user = await this.usersRepository.findOne({ id: userId });

      if (user) {
        const { hash, currentHashedRefreshToken, ...data } = user;
        return data;
      }

      return new HttpException('User does not exist', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw error;
    }
  }

  async setCurrentRefreshToken(refreshToken: string, userId: number) {
    const currentHashedRefreshToken = await bcrypt.hashSync(refreshToken, 10);
    await this.usersRepository.update(
      { id: userId },
      {
        currentHashedRefreshToken,
      }
    );
  }

  async getUserIfRefreshTokenMatches(refreshToken: string, userId: number) {
    const user = await this.usersRepository.findOne({ id: userId });

    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      user.currentHashedRefreshToken
    );

    if (!isRefreshTokenMatching) {
      throw new HttpException('Incorrect refresh token!', HttpStatus.FORBIDDEN);
    }

    return user;
  }

  async removeRefreshToken(userId: number) {
    return this.usersRepository.update(
      { id: userId },
      {
        currentHashedRefreshToken: null,
      }
    );
  }

  create(createUserDto: CreateUserDto): Promise<User> {
    const user = new User();
    user.walletAddress = createUserDto.walletAddress;

    return this.usersRepository.save(user);
  }

  async transfer(transferUserDto: TransferUserDto): Promise<any> {
    try {
      //Update user balances
      const transferAmount = transferUserDto.amount;
      const walletAddress = transferUserDto.walletAddress;
      const token = transferUserDto.tokenId === 0 ? 'leUSD' : 'leToken';
      const user = await getConnection()
        .createQueryBuilder()
        .select('user')
        .from(User, 'user')
        .where('user.walletAddress = :walletAddress', {
          walletAddress: walletAddress,
        })
        .getOne();

      //transferrer user
      const tUserId = transferUserDto.tUserId;
      const tUser = await getConnection()
        .createQueryBuilder()
        .select('user')
        .from(User, 'user')
        .where('user.id = :id', { id: tUserId })
        .getOne();

      if (user == null) {
        return {
          success: true,
          message: 'Invalid wallet address',
          data: 'walletaddress-failed',
        };
      }

      //tranfer user balance (check if sufficient)
      const tBalance = Number(tUser[token]);
      if (transferAmount > tBalance) {
        return {
          success: true,
          message: 'Insufficient balance',
          data: 'tBalance-failed',
        };
      }

      //reciever user balance
      const sBalance = Number(user[token]);
      const newAmount = Number(sBalance) + Number(transferAmount);
      const userId = user.id;
      await getConnection()
        .createQueryBuilder()
        .update(User)
        .set({ [token]: newAmount.toString() })
        .where('id = :id', { id: userId })
        .execute();

      //Create transaction records
      const transferTransaction = new Transaction();
      transferTransaction.amount = transferAmount;
      transferTransaction.userId = userId;
      transferTransaction.description = `Recieved ${
        token === 'leToken' ? 'LeToken' : 'LeUSD'
      }`;
      transferTransaction.type = 'Transfer';
      transferTransaction.toWalletAddress = tUser.walletAddress;

      //Reciever : create transaction record (update it balance)
      const transferTransactionObj = await this.transactionsRepository.save(
        transferTransaction
      );
      const tNewAmount = Number(tBalance) - Number(transferAmount);
      await getConnection()
        .createQueryBuilder()
        .update(User)
        .set({ [token]: tNewAmount.toString() })
        .where('id = :id', { id: tUserId })
        .execute();

      //Create transaction records
      const tTransferTransaction = new Transaction();
      tTransferTransaction.amount = transferAmount;
      tTransferTransaction.userId = tUserId;
      tTransferTransaction.description = `Transfer ${
        token === 'leToken' ? 'LeToken' : 'LeUSD'
      }`;
      tTransferTransaction.type = 'Transfer';
      tTransferTransaction.toWalletAddress = walletAddress;

      //Transferr : Create transaction record (update its balance)
      const tTransferTransactionObj = await this.transactionsRepository.save(
        tTransferTransaction
      );

      return {
        success: true,
        message: 'Transferred successfully',
        data: transferTransactionObj,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: {},
      };
    }
  }

  async countReferralById(id: number): Promise<any> {
    try {
      const totalUser = await getConnection()
        .createQueryBuilder()
        .select('user')
        .from(User, 'user')
        .where('user.sponsorId = :id', {
          id: id,
        })
        .getCount();

      return {
        success: true,
        message: 'Data found',
        data: totalUser,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: [],
      };
    }
  }

  async getUsersDirectSponsor(sponsorId: number): Promise<any> {
    try {
      const listOfUsers = await this.usersRepository.find({
        where: { sponsorId },
      });

      return {
        success: true,
        message: 'Data found',
        data: listOfUsers,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: [],
      };
    }
  }

  async getNextLevel(sponsors: any) {
    let newSponsorsList = [];
    let counter = 0;

    const [users, count] = await Promise.all(
      sponsors.map(async (sponsor) => {
        const [users, count] = await this.usersRepository.findAndCount({
          where: { sponsorId: sponsor.id },
        });

        newSponsorsList = [...newSponsorsList, ...users];
        counter += count;
      })
    );

    return { users: newSponsorsList, count: counter };
  }

  async getTotalUsersList(
    userId: number,
    level: number,
    sponsorsArray: any,
    totalUsers: any,
    limit
  ) {
    let sponsorsArrayCopy = sponsorsArray;
    const totalUsersCopy = totalUsers;
    let newSponsors: any = [];

    do {
      if (level <= limit || limit === 'nolimit') {
        if (level === 0) {
          const level0 = await this.usersRepository.find({
            where: { id: Number(userId) },
          });
          sponsorsArrayCopy = level0;
          const data = {
            level: level,
            count: 1,
            users: level0,
          };
          newSponsors = level0;
          totalUsersCopy.push(data);
        } else {
          const result = await this.getNextLevel(sponsorsArrayCopy);
          const { count, users } = result;
          newSponsors = users;

          if (!newSponsors.length) {
            return totalUsersCopy;
          }

          const data = {
            level: level,
            count: count,
            users: users,
          };
          totalUsersCopy.push(data);
        }

        return await this.getTotalUsersList(
          userId,
          level + 1,
          newSponsors,
          totalUsersCopy,
          limit
        );
      } else {
        return totalUsersCopy;
      }
    } while (level <= limit || limit === 'nolimit');
  }

  async getTotalUsers(query: any): Promise<any> {
    const { id, limit, q } = query;
    const result = await this.getTotalUsersList(
      id,
      0,
      [],
      [],
      isNaN(limit) ? 'nolimit' : Number(limit)
    );

    if (q) {
      const newResult = result.map((level) => {
        const newUsers = level.users?.filter((sponsor) => {
          return (
            sponsor.walletAddress.indexOf(q) >= 0 ||
            sponsor.ranking === q ||
            sponsor.referralCode.indexOf(q) >= 0
          );
        });

        return {
          ...level,
          users: newUsers,
        };
      });

      return newResult;
    }

    return result;
  }

  async getUserCount(id: number): Promise<any> {
    const result = await this.getTotalUsersList(id, 0, [], [], 'nolimit');

    let totalUsers = 0;
    result.forEach((level) => {
      totalUsers += level.count;
    });

    return { totalUsers, totalLevel: result.length - 1 };
  }

  async getUserbyId(id: number): Promise<any> {
    try {
      const userDetail = await this.usersRepository.find({
        where: { id },
      });

      return {
        success: true,
        message: 'Data found',
        data: userDetail,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: [],
      };
    }
  }

  async getUserTransferStatus(id: number): Promise<any> {
    try {
      const userDetail = await this.usersRepository.findOne({
        where: { id },
      });

      return {
        success: true,
        message: 'User lock transfer status.',
        data: userDetail.lockTransfer,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: [],
      };
    }
  }

  async getUserDashboard(walletAddress: string): Promise<any> {
    try {
      const userDetail = await this.usersRepository.find({
        where: { walletAddress },
      });

      return {
        success: true,
        message: 'Data found',
        data: userDetail,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: [],
      };
    }
  }

  async getAccountInfo(walletAddress: string): Promise<any> {
    try {
      const accounts = await this.usersRepository.find({
        where: { walletAddress },
      });

      return {
        success: true,
        message: 'Data found',
        data: accounts.map((account) => {
          const reps = {
            ...account,
            ...(account.hash === null
              ? { isHasPassword: false }
              : { isHasPassword: true }),
          };

          delete reps.hash;
          return reps;
        }),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: [],
      };
    }
  }

  async updateUser(userId: number, userData: User): Promise<any> {
    try {
      const resp = await this.usersRepository.update(
        { id: userId },
        {
          ...userData,
        }
      );
      return {
        success: true,
        message: 'Update Successfully',
        data: resp,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  async uploadToS3(fileName: string): Promise<any> {
    const readStream = await fs.createReadStream(`${__dirname}/${fileName}`);
    const s3bucket = new AWS.S3({
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      region: 'ap-east-1',
    });

    const params = {
      Bucket: 'x0x-assets',
      Key: fileName,
      Body: readStream,
    };

    return new Promise((resolve, reject) => {
      s3bucket.upload(params, function (err, data) {
        readStream.destroy();

        if (err) {
          return reject(err);
        }

        return resolve(data);
      });
    });
  }

  async getByWalletAddress(walletAddress: string): Promise<any> {
    const user = await this.usersRepository.findOne({ walletAddress });

    if (user) {
      const { hash, currentHashedRefreshToken, ...publicData } = user;
      return new HttpException(
        {
          status: HttpStatus.OK,
          message: 'Success',
          data: publicData,
        },
        HttpStatus.OK
      );
    }

    return new HttpException('User does not exist', HttpStatus.NOT_FOUND);
  }

  async getAll(queries: IPaginationParams): Promise<any> {
    try {
      const { offset, limit, sort } = queries;
      const order = sort === 'ASC' ? 1 : -1;
      const [items, count] = await this.usersRepository.findAndCount({
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
      console.log(error);
      return {
        success: false,
        message: error.message,
        data: [],
        meta: {},
      };
    }
  }

  // splitStr(str:string){

  //   // Function to split string
  //   let string = str.split("*");

  //   console.log(string);
  //   return string;
  // }

  async createTransactionMM(
    walletAddress: string,
    usdtAmount: string
  ): Promise<any> {
    const user = await this.usersRepository.findOne({ walletAddress });

    if (user) {
      const dailyUSDT_Total =
        user.dailyUSDTamount + Number.parseFloat(usdtAmount);
      const tokenPurchased = Number.parseFloat(usdtAmount) * 0.4;
      const newMlonAmount = user.mlonPurchased + tokenPurchased;
      const newUsdtAmount = user.usdtSpend + Number.parseFloat(usdtAmount);
      const resp = await this.usersRepository.update(
        { id: user.id },
        {
          mlonPurchased: newMlonAmount,
          usdtSpend: newUsdtAmount,
          dailyUSDTamount: dailyUSDT_Total,
        }
      );

      //Create transaction records
      const transferTransaction = new Transaction();
      transferTransaction.amount = Number.parseFloat(usdtAmount);
      transferTransaction.userId = user.id;
      transferTransaction.description = 'Purchased MOLON';
      transferTransaction.type = 'Purchase';
      transferTransaction.toWalletAddress = 'COMPANY';

      //Reciever : create transaction record (update it balance)
      const transactionResp = await this.transactionsRepository.save(
        transferTransaction
      );

      //logic for comp plan

      //search for sponsorid and get his column upline
      const userAboveHimString = user.totalUplineString;
      const userList = userAboveHimString.split(',');
      console.log('list of user above him : ' + userList);

      //do a loop for userlist
      for (let i = 0; i < Number(userList.length); i++) {
        const leaderUser = await this.usersRepository.findOne({
          where: { id: userList[0] },
        });
        if (user.leadershipPower > 0) {
          //calculate usdt
          //leadership power is in whole number. must convert to percent
          const rewardAmount =
            Number.parseFloat(usdtAmount) * (leaderUser.leadershipPower / 100);
          //give usdt
          const rewardsTransaction = new Transaction();
          transferTransaction.amount = rewardAmount;
          transferTransaction.userId = leaderUser.id;
          transferTransaction.description =
            'Rewards from ' +
            user.walletAddress +
            '. Spend ' +
            usdtAmount +
            ' USDT.';
          transferTransaction.type = 'Rewards';
          transferTransaction.fromWalletAddress = user.walletAddress;
        }
      }

      return new HttpException(
        {
          status: HttpStatus.OK,
          message: 'Success',
          data: transactionResp,
        },
        HttpStatus.OK
      );
    }

    return new HttpException('User does not exist', HttpStatus.NOT_FOUND);
  }
  async getTotalCommunityMLONPurchased(sponsorId: number): Promise<any> {
    try {
      let usersList = [];

      const communityList = await this.getTotalUsersList(
        sponsorId,
        0,
        [],
        [],
        'nolimit'
      );

      communityList.forEach((level) => {
        if (level.level != 0) {
          usersList = [...usersList, ...level.users];
        }
      });

      let totalMLONPurchased = 0;
      let totalUSDTSpend = 0;

      const totalCommunityMLON = await Promise.all(
        usersList.map(async (user) => {
          totalMLONPurchased = totalMLONPurchased + user.mlonPurchased;
          totalUSDTSpend = totalUSDTSpend + user.usdtSpend;
        })
      );
      console.log('totalMLONPurchased : ', totalMLONPurchased);
      // console.log('totalUSDTSpend : ', totalSemiAccount);
      return {
        success: true,
        message: 'Success',
        data: totalCommunityMLON,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: 0,
      };
    }
  }

  async getTotalCommunityUSDTSpend(sponsorId: number): Promise<any> {
    try {
      let usersList = [];

      const communityList = await this.getTotalUsersList(
        sponsorId,
        0,
        [],
        [],
        'nolimit'
      );

      communityList.forEach((level) => {
        if (level.level != 0) {
          usersList = [...usersList, ...level.users];
        }
      });

      let totalUSDTSpend = 0;

      const totalCommunityUSDT = await Promise.all(
        usersList.map(async (user) => {
          totalUSDTSpend = totalUSDTSpend + user.usdtSpend;
        })
      );
      //console.log('totalMLONPurchased : ', totalMLONPurchased);
      console.log('totalUSDTSpend : ', totalCommunityUSDT);
      return {
        success: true,
        message: 'Success',
        data: totalCommunityUSDT,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: 0,
      };
    }
  }

  //check if referral code exist
  async checkReferralCode(refCode: string): Promise<any> {
    let result = false;
    let message = 'Referral code dont exist';
    try {
      const [users, count] = await this.usersRepository.findAndCount({
        where: { referralCode: refCode },
      });
      console.log('user ', users);
      if (count > 0) {
        result = true;
        message = 'Referral code found!';
      }
      return {
        success: true,
        message: message,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: false,
      };
    }
  }
}
