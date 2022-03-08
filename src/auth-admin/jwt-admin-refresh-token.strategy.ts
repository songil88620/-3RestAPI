import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

import { AdminService } from '../admin/admin.service';
import { TokenPayload } from './token-payload.interface';

@Injectable()
export class JwtAdminRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-admin-refresh-token'
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly adminService: AdminService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.refresh_token;
        },
      ]),
      secretOrKey: configService.get('JWT_REFRESH_TOKEN_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: TokenPayload) {
    const refreshToken = request.cookies?.refresh_token;
    return this.adminService.getUserIfRefreshTokenMatches(
      refreshToken,
      payload.adminId
    );
  }
}
