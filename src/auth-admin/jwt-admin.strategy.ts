import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

import { AdminService } from '../admin/admin.service';
import { TokenPayload } from './token-payload.interface';

@Injectable()
export class JwtAdminStrategy extends PassportStrategy(Strategy, 'jwt-admin') {
  constructor(
    private readonly configService: ConfigService,
    private readonly adminService: AdminService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.access_token;
        },
      ]),
      secretOrKey: configService.get('JWT_ACCESS_TOKEN_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(payload: TokenPayload) {
    return this.adminService.getById(payload.adminId);
  }
}
