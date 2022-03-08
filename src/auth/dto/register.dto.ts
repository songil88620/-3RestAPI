import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    required: true,
    description: 'Your wallet address',
    example: '3834h427',
  })
  walletAddress: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    required: true,
    description: 'You register referral form',
    example: '3834h427',
  })
  referralCode?: string;

  @IsNotEmpty()
  @IsString()
  @Length(132, 132)
  @ApiProperty({
    required: true,
    description: 'Signature for message',
    example:
      '0xc5f30a1b7b9a036f8e92b8f4105129bdc29520c6d22f04a1c9e474b47a2c5ead35f2027143eb932cde364f9cc9259fe268afa94f947ce31e8082180a55120fe01b',
    minLength: 132,
    maxLength: 132,
  })
  signature: string;
}
