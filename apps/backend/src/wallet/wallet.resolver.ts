import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { WalletService } from './wallet.service';
import { WalletTX } from './entities/wallet-tx.entity';
import { CampaignContribution } from '../campaigns/entities/campaign-contribution.entity';
import { ContributeToCampaignInput, BankWithdrawalInput } from './dto';
import { PaginationInput, WalletTransactionFilter } from './dto/get-wallet-transactions.input';
import type {JwtPayload} from "../auth/auth.service";

@Resolver()
@UseGuards(JwtAuthGuard)
export class WalletResolver {
  constructor(private readonly walletService: WalletService) {}

  @Query(() => Number, { name: 'walletBalance' })
  async getWalletBalance(@GetCurrentUser() user: JwtPayload): Promise<number> {
    return this.walletService.getUserWalletBalance(user.userId);
  }

  @Query(() => [WalletTX], { name: 'walletTransactions' })
  async getWalletTransactions(@GetCurrentUser() user: JwtPayload): Promise<WalletTX[]> {
    return this.walletService.getUserTransactions(user.userId);
  }

@Query(() => [WalletTX], { name: 'myWalletTransactions' })
  async getMyWalletTransactions(
    @GetCurrentUser() user: JwtPayload,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
    @Args('filter', { nullable: true }) filter?: WalletTransactionFilter,
  ): Promise<WalletTX[]> {
    const paginationInput = pagination || { limit: 100, offset: 0 };
    const filterInput = filter || {};

    return this.walletService.getFilteredUserTransactions(
      user.userId,
      filterInput,
      paginationInput
    );
  }

  @Mutation(() => WalletTX)
  async depositMoney(
    @GetCurrentUser() user: JwtPayload,
    @Args('amount') amount: number,
    @Args('externalReference', { nullable: true }) externalReference?: string,
  ): Promise<WalletTX> {
    return this.walletService.depositMoney(user.userId, amount, externalReference);
  }

  @Mutation(() => CampaignContribution)
  async contributeToCampaign(
    @GetCurrentUser() user: JwtPayload,
    @Args('input') input: ContributeToCampaignInput,
  ): Promise<CampaignContribution> {
    return this.walletService.contributeToCampaign(user.userId, input);
  }

  @Mutation(() => WalletTX)
  async withdrawToBank(
    @GetCurrentUser() user: JwtPayload,
    @Args('input') input: BankWithdrawalInput,
  ): Promise<WalletTX> {
    return this.walletService.withdrawToBank(user.userId, input);
  }
}
