import {
  UseGuards,
  Body,
  Controller,
  Get,
  Post,
  Request,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { RegisterDto } from './dto/register.dto';
import { User } from '../users/users.entity';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LocalAuthGuard } from './local-auth.guard';
import { HttpCode } from '@nestjs/common';
import { JwtRefreshGuard } from './jwt-refresh.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {}

  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(@Request() request: any) {
    const { id: userId } = request.user;
    const accessTokenCookie =
      this.authService.getCookieWithJwtAccessToken(userId);
    const refreshTokenCookie =
      this.authService.getCookieWithJwtRefreshToken(userId);
    await this.usersService.setCurrentRefreshToken(
      refreshTokenCookie.token,
      userId
    );

    request.res.setHeader('Set-Cookie', [
      accessTokenCookie,
      refreshTokenCookie.cookie,
    ]);
    return {
      success: true,
      message: 'Authenticated',
      data: request.user,
    };
  }

  @UseGuards(JwtRefreshGuard)
  @Get('/refresh-token')
  refresh(@Request() request: any) {
    const { id: userId } = request.user;
    const accessTokenCookie =
      this.authService.getCookieWithJwtAccessToken(userId);

    request.res.setHeader('Set-Cookie', accessTokenCookie);
    return {
      success: true,
      message: 'Authenticated',
      data: request.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('/logout')
  @HttpCode(200)
  async logOut(@Request() request: any) {
    const { id: userId } = request.user;
    await this.usersService.removeRefreshToken(userId);
    request.res.setHeader('Set-Cookie', this.authService.getCookiesForLogOut());
  }

  @Post('/register')
  register(@Body() registerDto: RegisterDto): Promise<User> {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/me')
  me(@Request() request: any) {
    const { id: adminId } = request.user;
    const resp = this.authService.getById(adminId);

    return resp;
  }
}
