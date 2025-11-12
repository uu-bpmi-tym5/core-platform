import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsPositive, IsOptional, IsString } from 'class-validator';
import { TransactionType } from '../entities/wallet-tx.entity';

@InputType()
export class CreateWalletTransactionInput {
  @Field(() => TransactionType)
  type: TransactionType;

  @Field(() => Number)
  @IsPositive({ message: 'Částka musí být kladná' })
  amount: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID(4, { message: 'Neplatné ID kampaně' })
  campaignId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  externalReference?: string;
}

@InputType()
export class ContributeToCampaignInput {
  @Field(() => String)
  @IsUUID(4, { message: 'Neplatné ID kampaně' })
  campaignId: string;

  @Field(() => Number)
  @IsPositive({ message: 'Částka příspěvku musí být kladná' })
  amount: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  message?: string;
}

@InputType()
export class BankWithdrawalInput {
  @Field(() => Number)
  @IsPositive({ message: 'Částka výběru musí být kladná' })
  amount: number;

  @Field(() => String)
  @IsString({ message: 'Číslo účtu je povinné' })
  bankAccount: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}
