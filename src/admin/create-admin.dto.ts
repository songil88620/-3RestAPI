import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminDto {
  @ApiProperty({ name: 'firstName' })
  firstName: string;

  @ApiProperty({ name: 'lastName' })
  lastName: string;

  @ApiProperty({ name: 'email' })
  email: string;

  @ApiProperty({ name: 'username' })
  username: string;

  @ApiProperty({ name: 'password' })
  password: string;

  @ApiProperty({ name: 'confirmPassword' })
  confirmPassword: string;
}
