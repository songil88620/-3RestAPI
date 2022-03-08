import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

import { UsersService } from '../users/users.service';
import { AdminService } from '../admin/admin.service';
import { TokenPayload } from './interfaces/tokenPayload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly adminService: AdminService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.access_token;
        },
      ]),
      secretOrKey: configService.get('JWT_ACCESS_TOKEN_SECRET'),
    });
  }

  async validate(payload: TokenPayload) {
    if (payload.userId) {
      return this.usersService.getById(payload.userId);
    }

    return this.adminService.getById(payload.adminId);
  }
}
