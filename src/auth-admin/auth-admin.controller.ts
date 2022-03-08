import {
  UseGuards,
  Body,
  Controller,
  Get,
  Post,
  Request,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CreateAdminDto, ResetPasswordDto } from './create-admin.dto';
import { User } from '../users/users.entity';
import { AuthAdminService } from './auth-admin.service';
import { AdminService } from '../admin/admin.service';
import { LocalAdminAuthGuard } from './local-auth.guard';
import { HttpCode } from '@nestjs/common';
import { JwtAdminRefreshGuard } from './jwt-admin-refresh.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Admin } from 'src/admin/admin.entity';

@ApiTags('auth-admin')
@Controller('auth-admin')
export class AuthAdminController {
  constructor(
    private readonly authAdminService: AuthAdminService,
    private readonly adminService: AdminService
  ) {}

  @Post()
  create(@Body() createAdminDto: CreateAdminDto): Promise<User> {
    return this.authAdminService.create(createAdminDto);
  }

  @HttpCode(200)
  @UseGuards(LocalAdminAuthGuard)
  @Post('/login')
  async login(@Request() request: any) {
    const { id: adminId } = request.user;
    const accessTokenCookie =
      this.authAdminService.getCookieWithJwtAccessToken(adminId);
    const refreshTokenCookie =
      this.authAdminService.getCookieWithJwtRefreshToken(adminId);
    await this.adminService.setCurrentRefreshToken(
      refreshTokenCookie.token,
      adminId
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

  @UseGuards(JwtAdminRefreshGuard)
  @Get('/refresh-token')
  refresh(@Request() request: any) {
    const { id: adminId } = request.user;
    const accessTokenCookie =
      this.authAdminService.getCookieWithJwtAccessToken(adminId);

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
    const { id: adminId } = request.user;
    await this.adminService.removeRefreshToken(adminId);
    request.res.setHeader(
      'Set-Cookie',
      this.authAdminService.getCookiesForLogOut()
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('/reset-password')
  resetPrivateKey(@Body() resetPasswordDto: ResetPasswordDto): Promise<Admin> {
    return this.authAdminService.resetPassword(resetPasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/me')
  me(@Request() request: any) {
    const { id: adminId } = request.user;
    return this.authAdminService.getById(adminId);
  }
}
