import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

// Entities
import { User } from './users/users.entity';
import { Transaction } from './transaction/transactions.entity';
import { Hash } from './hash/hashs.entity';
import { Admin } from './admin/admin.entity';
import { Leader } from './leaders/leaders.entity';

// Modules
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LeadersModule } from './leaders/leaders.module';

import { TransactionsModule } from './transaction/transactions.module';
import { HashsModule } from './hash/hashs.module';
import { AdminModule } from './admin/admin.module';
import { AuthAdminModule } from './auth-admin/auth-admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        DATABASE_HOST: Joi.string().required(),
        DATABASE_PORT: Joi.string().required(),
        DATABASE_USER: Joi.string().required(),
        DATABASE_PASSWORD: Joi.string().required(),
        DATABASE_NAME: Joi.string().required(),
        WHITELIST_ORIGIN: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION_TIME: Joi.number().required(),
        JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
        JWT_ACCESS_TOKEN_EXPIRATION_TIME: Joi.string().required(),
        JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
        JWT_REFRESH_TOKEN_EXPIRATION_TIME: Joi.string().required(),
        AWS_ACCESS_KEY_ID: Joi.string().required(),
        AWS_SECRET_ACCESS_KEY: Joi.string().required(),
        AWS_S3_BUCKET: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService, _configModule) => ({
        type: 'mysql',
        host: configService.get('DATABASE_HOST'),
        port: parseInt(configService.get('DATABASE_PORT'), 10) || 3306,
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [User, Transaction, Hash, Admin, Leader],
        synchronize: true,
      }),
    }),
    UsersModule,
    AuthModule,
    TransactionsModule,
    HashsModule,
    AdminModule,
    AuthAdminModule,
    LeadersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  constructor(private connection: Connection) {}
}
