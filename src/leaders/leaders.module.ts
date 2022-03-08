import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Leader } from './leaders.entity';
import { LeadersController } from './leaders.controller';
import { LeadersService } from './leaders.service';

@Module({
  imports: [TypeOrmModule.forFeature([Leader]), ConfigModule],
  providers: [LeadersService, ConfigService],
  controllers: [LeadersController],
})
export class LeadersModule {}
