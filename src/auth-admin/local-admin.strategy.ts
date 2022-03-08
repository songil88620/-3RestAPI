import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthAdminService } from './auth-admin.service';

@Injectable()
export class LocalAdminStrategy extends PassportStrategy(
  Strategy,
  'local-admin'
) {
  constructor(private authAdminService: AuthAdminService) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(email: string, password: string): Promise<any> {
    const resp = await this.authAdminService.validateAdmin(email, password);

    if (!resp) {
      throw new UnauthorizedException(
        'Incorrect Email and Password combination'
      );
    }

    return resp;
  }
}
