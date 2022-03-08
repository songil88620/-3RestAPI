import { ApiProperty } from '@nestjs/swagger';

export class IWalletAddress {
  @ApiProperty({
    name: 'walletAddress',
    example: '0x467aC5BA181b7ef22c654C5523B32B765443ac5E',
  })
  walletAddress?: string;
}

export class IUserId {
  @ApiProperty({ name: 'userId', example: 1 })
  userId?: number;
}

export class IPaginationParams {
  @ApiProperty()
  offset?: number;

  @ApiProperty()
  limit?: number;

  @ApiProperty({ name: 'sort', enum: ['DESC', 'ASC'] })
  sort?: string;
}

export class IFilterParams {
  @ApiProperty({ name: 'userId' })
  userId?: number;

  @ApiProperty({ name: 'referralCode' })
  referralCode?: string;

  @ApiProperty({ name: 'walletAddress' })
  walletAddress?: string;

  @ApiProperty({ name: 'createdAt' })
  createdAt?: string;

  @ApiProperty({ name: 'ownFunding' })
  ownFunding?: number;
}
