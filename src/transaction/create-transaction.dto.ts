export class CreateTransactionDto {
  sponsorId: number;
}

export class UpdateTransactionDto {
  amount: number;
  createdAt: string;
  description: string;
  fromWalletAddress: string;
  id: number;
  toWalletAddress: string;
  type: string;
  updatedAt: string;
  userId: number;
}
