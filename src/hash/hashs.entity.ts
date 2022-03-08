import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';

import { User } from '../users/users.entity';

@Entity()
export class Hash {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.hashEth)
  user: User;

  @Column({ default: null })
  hashTransaction: string;

  @Column({ default: null })
  status?: string;

  @Column({ default: null })
  type?: string;

  @Column({ default: null })
  userWallet: string;

  @Column({ default: null })
  userId?: number;

  @Column({ default: 0 })
  amount?: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
