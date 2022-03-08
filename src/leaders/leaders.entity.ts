import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Leader {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: null })
  communityLeaderUserId?: number;

  @Column({ default: null })
  assignedLeaderId: number;

  @Column({ unique: true })
  leaderPercent: number;

  @Column({ default: '0' })
  line: number;

  // @OneToMany(() => Transaction, (transaction) => transaction.user)
  // transaction?: Transaction[];

  // @OneToMany(() => Hash, (hash) => hash.user)
  // hashEth?: Hash[];

  // @OneToMany(() => Transaction, (transaction) => transaction.user)
  // transactions?: Transaction[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
