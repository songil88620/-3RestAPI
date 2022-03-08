import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User } from '../users/users.entity';
import { Admin } from '../admin/admin.entity';
import { Transaction } from '../transaction/transactions.entity';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { AdminService } from '../admin/admin.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { JwtRefreshTokenStrategy } from './jwt-refresh-token.strategy';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    PassportModule,
    TypeOrmModule.forFeature([User, Transaction, Admin]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: `${configService.get('JWT_EXPIRATION_TIME')}s`,
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshTokenStrategy,
    UsersService,
    AdminService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
