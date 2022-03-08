import { ApiProperty } from '@nestjs/swagger';

export class PaginationParams {
  @ApiProperty()
  offset?: number;

  @ApiProperty()
  limit?: number;

  @ApiProperty({ name: 'sort', enum: ['DESC', 'ASC'] })
  sort?: string;
}

export class FilterParams {
  @ApiProperty()
  packageId?: string;

  @ApiProperty()
  dateStart?: string;

  @ApiProperty()
  dateEnd?: string;
}

export class SearchParams {
  @ApiProperty()
  walletAddress?: string;
}
