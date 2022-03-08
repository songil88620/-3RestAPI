import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Transaction } from 'src/transaction/transactions.entity';
import { Hash } from 'src/hash/hashs.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: null })
  firstName?: string;

  @Column({ default: null })
  lastName?: string;

  @Column({ unique: true })
  walletAddress: string;

  @Column({ default: '0' })
  mlonTokenBalance?: string;

  @Column({ default: 1 })
  isActive?: number;

  @Column({ default: 0 })
  usdtSpend: number;

  @Column({ default: 0 })
  mlonPurchased: number;

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transaction?: Transaction[];

  @OneToMany(() => Hash, (hash) => hash.user)
  hashEth?: Hash[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions?: Transaction[];

  @Column({ default: null })
  referralCode?: string;

  @Column({ default: 1 })
  sponsorId?: number;

  @Column({ default: null })
  sponsorerLine?: number;

  @Column({ default: 0 })
  numberOfLine?: number;

  @Column({ default: 0 })
  leadershipPower: number;

  @Column({ default: null })
  totalUplineString: string;

  @Column({ default: 0 })
  dailyUSDTamount: number;

  @Column({ type: 'boolean', default: false })
  lockTransfer: boolean;

  @Column({ type: 'boolean', default: false })
  lockWithdrawMlon: boolean;

  @Column({ default: null })
  hash: string;

  @Column({
    nullable: true,
  })
  public currentHashedRefreshToken?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
