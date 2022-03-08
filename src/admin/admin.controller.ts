import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * getPoolDetails by pool Id
   * @param param
   * @returns
   */
  @UseGuards(JwtAuthGuard)
  @Get(':adminId')
  getPool(@Param() { adminId }: { adminId: number }): Promise<any> {
    return this.adminService.getById(adminId);
  }
}
