import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from "typeorm";
import { User } from '../../users/entities/user.entity';

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  CAMPAIGN_CONTRIBUTION = 'CAMPAIGN_CONTRIBUTION',
  REFUND = 'REFUND',
  BANK_WITHDRAWAL = 'BANK_WITHDRAWAL'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

registerEnumType(TransactionType, {
  name: 'TransactionType',
});

registerEnumType(TransactionStatus, {
  name: 'TransactionStatus',
});

@Entity()
@ObjectType()
export class WalletTX {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String, { description: 'ID of the wallet transaction' })
  id: string;

  @Column()
  @Field(() => String, { description: 'User ID who made the transaction' })
  userId: string;

  @ManyToOne(() => User)
  @Field(() => User, { description: 'User who made the transaction' })
  user: User;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  @Field(() => TransactionType, { description: 'Type of transaction' })
  type: TransactionType;

  @Column('decimal', { precision: 10, scale: 2 })
  @Field(() => Number, { description: 'Amount of the transaction' })
  amount: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING
  })
  @Field(() => TransactionStatus, { description: 'Status of the transaction' })
  status: TransactionStatus;

  @Column({ nullable: true })
  @Field(() => String, { nullable: true, description: 'Campaign ID if related to campaign' })
  campaignId?: string;

  @Column('text', { nullable: true })
  @Field(() => String, { nullable: true, description: 'Description of the transaction' })
  description?: string;

  @Column('text', { nullable: true })
  @Field(() => String, { nullable: true, description: 'Reference ID for external systems' })
  externalReference?: string;

  @CreateDateColumn()
  @Field(() => Date, { description: 'Creation date of the transaction' })
  createdAt: Date;
}
