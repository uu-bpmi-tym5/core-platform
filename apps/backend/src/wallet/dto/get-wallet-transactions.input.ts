import { Field, InputType, Int, Float } from '@nestjs/graphql';
import { TransactionStatus, TransactionType } from '../entities/wallet-tx.entity';

@InputType()
export class PaginationInput {
  @Field(() => Int, { defaultValue: 20 })
  limit: 100;

  @Field(() => Int, { defaultValue: 0 })
  offset: number;
}

@InputType()
export class WalletTransactionFilter {
  @Field(() => [TransactionStatus], { nullable: true })
  status?: TransactionStatus[];

  @Field(() => [TransactionType], { nullable: true })
  type?: TransactionType[];

  @Field(() => Date, { nullable: true })
  fromDate?: Date;

  @Field(() => Date, { nullable: true })
  toDate?: Date;

  @Field(() => Float, { nullable: true })
  minAmount?: number;

  @Field(() => Float, { nullable: true })
  maxAmount?: number;

  @Field(() => String, { nullable: true, description: 'Hledání v description' })
  search?: string;
  
}