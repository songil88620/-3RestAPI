import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Admin } from '../admin/admin.entity';
import { AdminModule } from '../admin/admin.module';
import { AdminService } from '../admin/admin.service';
import { AuthAdminController } from './auth-admin.controller';
import { AuthAdminService } from './auth-admin.service';
import { LocalAdminStrategy } from './local-admin.strategy';
import { JwtAdminStrategy } from './jwt-admin.strategy';
import { JwtAdminRefreshTokenStrategy } from './jwt-admin-refresh-token.strategy';

@Module({
  imports: [
    ConfigModule,
    AdminModule,
    PassportModule,
    TypeOrmModule.forFeature([Admin]),
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
    AuthAdminService,
    LocalAdminStrategy,
    JwtAdminStrategy,
    JwtAdminRefreshTokenStrategy,
    AdminService,
  ],
  controllers: [AuthAdminController],
  exports: [AuthAdminService],
})
export class AuthAdminModule {}
