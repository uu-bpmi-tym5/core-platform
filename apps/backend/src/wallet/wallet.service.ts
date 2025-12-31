import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Brackets, Repository } from 'typeorm';
import { WalletTX, TransactionType, TransactionStatus } from './entities/wallet-tx.entity';
import { User } from '../users/entities/user.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { CampaignContribution } from '../campaigns/entities/campaign-contribution.entity';
import { ContributeToCampaignInput, BankWithdrawalInput } from './dto';
import { NotificationsClient } from '../notifications/notifications.client';
import { PaginationInput, WalletTransactionFilter } from './dto/get-wallet-transactions.input';
import { AuditLogService, AuditAction } from '../audit-log';

@Injectable()
export class WalletService {
  constructor(
    @Inject('WALLET_TX_REPOSITORY')
    private walletTxRepository: Repository<WalletTX>,
    @Inject('USER_REPOSITORY')
    private userRepository: Repository<User>,
    @Inject('CAMPAIGN_REPOSITORY')
    private campaignRepository: Repository<Campaign>,
    @Inject('CAMPAIGN_CONTRIBUTION_REPOSITORY')
    private contributionRepository: Repository<CampaignContribution>,
    private notificationsClient: NotificationsClient,
    private auditLogService: AuditLogService,
  ) {}

  async getUserWalletBalance(userId: string): Promise<number> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['walletBalance']
    });

    if (!user) {
      throw new NotFoundException('Uživatel nebyl nalezen');
    }

    return user.walletBalance;
  }

  async getUserTransactions(userId: string): Promise<WalletTX[]> {
    return this.walletTxRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
async getFilteredUserTransactions(
    userId: string,
    filter: WalletTransactionFilter,
    pagination: PaginationInput
  ): Promise<WalletTX[]> {

    //validace vstupu

    // min>max
    if (filter.minAmount != null && filter.maxAmount != null) {
      if (filter.minAmount > filter.maxAmount) {
        throw new BadRequestException('minAmount nemůže být větší než maxAmount');
      }
    }

    // fromDate > toDate
    if (filter.fromDate && filter.toDate) {
      if (new Date(filter.fromDate) > new Date(filter.toDate)) {
        throw new BadRequestException('fromDate nemůže být později než toDate');
      }
    }

    // listování
    // nesmí být záporný limit
    if (pagination.limit <= 0) {
      throw new BadRequestException('Listování limit musí být kladné číslo');
    }
    // stránek limit 100
    if (pagination.limit > 100) {
      throw new BadRequestException('Listování limit nesmí být větší než 100'); 
    }
    // offset nesmí být záporný
    if (pagination.offset < 0) {
       throw new BadRequestException('Offset nesmí být záporný');
    }

    const query = this.walletTxRepository.createQueryBuilder('tx');
    query.where('tx.userId = :userId', { userId });

    //filtry
    
    //status
    if (filter.status && filter.status.length > 0) {
      query.andWhere('tx.status IN (:...statuses)', { statuses: filter.status });
    }

    //typ
    if (filter.type && filter.type.length > 0) {
      query.andWhere('tx.type IN (:...types)', { types: filter.type });
    }

    //datum
    if (filter.fromDate) {
      query.andWhere('tx.createdAt >= :from', { from: filter.fromDate });
    }
    if (filter.toDate) {
      query.andWhere('tx.createdAt <= :to', { to: filter.toDate });
    }

    //částky
    if (filter.minAmount != null) {
      query.andWhere('tx.amount >= :minAmount', { minAmount: filter.minAmount });
    }
    if (filter.maxAmount != null) {
      query.andWhere('tx.amount <= :maxAmount', { maxAmount: filter.maxAmount });
    }

    //jednoduchý search
    if (filter.search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('tx.description LIKE :search', { search: `%${filter.search}%` })
            .orWhere('tx.externalReference LIKE :search', { search: `%${filter.search}%` });
        }),
      );
    }

   //stránkování

    query.orderBy('tx.createdAt', 'DESC');
    query.take(pagination.limit); 
    query.skip(pagination.offset);

    
    return query.getMany();
  }

  async depositMoney(userId: string, amount: number, externalReference?: string): Promise<WalletTX> {
    // Vytvoř transakci
    const transaction = this.walletTxRepository.create({
      userId,
      type: TransactionType.DEPOSIT,
      amount,
      status: TransactionStatus.COMPLETED,
      description: `Deposit ${amount} $`,
      externalReference,
    });

    const savedTransaction = await this.walletTxRepository.save(transaction);

    // Aktualizuj zůstatek uživatele
    await this.userRepository.increment({ id: userId }, 'walletBalance', amount);

    // Audit log for deposit
    await this.auditLogService.logSuccess(
      AuditAction.WALLET_DEPOSIT,
      'wallet_transaction',
      savedTransaction.id,
      `Deposit of ${amount} $ completed`,
      {
        actorId: userId,
        newValues: {
          amount,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
        },
        entityOwnerId: userId,
      },
    );

    // Pošli notifikaci
    await this.notificationsClient.createSuccessNotification(
      userId,
      'Vklad byl úspěšně proveden! 💰',
      `Na váš účet bylo připsáno ${amount} $`,
      `/wallet`
    );

    // Načti transakci s relací user
    const transactionWithUser = await this.walletTxRepository.findOne({
      where: { id: savedTransaction.id },
      relations: ['user'],
    });

    return transactionWithUser!;
  }

  async contributeToCampaign(contributorId: string, input: ContributeToCampaignInput): Promise<CampaignContribution> {
    const { campaignId, amount, message } = input;

    // Zkontroluj zůstatek
    const currentBalance = await this.getUserWalletBalance(contributorId);
    if (currentBalance < amount) {
      throw new BadRequestException('Nedostatečný zůstatek v peněžence');
    }

    // Get campaign info for audit log
    const campaign = await this.campaignRepository.findOne({ where: { id: campaignId } });

    // Vytvoř transakci
    const transaction = this.walletTxRepository.create({
      userId: contributorId,
      type: TransactionType.CAMPAIGN_CONTRIBUTION,
      amount,
      campaignId,
      status: TransactionStatus.COMPLETED,
      description: `Příspěvek na kampaň ${amount} $`,
    });

    const savedTransaction = await this.walletTxRepository.save(transaction);

    // Vytvoř příspěvek
    const contribution = this.contributionRepository.create({
      campaignId,
      contributorId,
      amount,
      message,
      walletTxId: savedTransaction.id,
    });

    const savedContribution = await this.contributionRepository.save(contribution);

    // Odečti ze zůstatku
    await this.userRepository.decrement({ id: contributorId }, 'walletBalance', amount);

    // Aktualizuj currentAmount kampaně
    await this.campaignRepository.increment({ id: campaignId }, 'currentAmount', amount);

    // Audit log for contribution
    await this.auditLogService.logSuccess(
      AuditAction.CONTRIBUTION_CREATE,
      'campaign_contribution',
      savedContribution.id,
      `Contribution of ${amount} $ to campaign "${campaign?.name || campaignId}"`,
      {
        actorId: contributorId,
        newValues: {
          amount,
          campaignId,
          message: message ? '[message provided]' : undefined,
        },
        entityOwnerId: campaign?.creatorId,
        metadata: { transactionId: savedTransaction.id },
      },
    );

    // Pošli notifikaci přispěvateli
    await this.notificationsClient.createSuccessNotification(
      contributorId,
      'Příspěvek byl odeslán! 🎯',
      `Úspěšně jste přispěli ${amount} $ na kampaň`,
      `/campaigns/${campaignId}`
    );

    return savedContribution;
  }

  async withdrawToBank(userId: string, input: BankWithdrawalInput): Promise<WalletTX> {
    const { amount, bankAccount, description } = input;

    // Zkontroluj zůstatek
    const currentBalance = await this.getUserWalletBalance(userId);
    if (currentBalance < amount) {
      throw new BadRequestException('Nedostatečný zůstatek v peněžence');
    }

    // Vytvoř transakci
    const transaction = this.walletTxRepository.create({
      userId,
      type: TransactionType.BANK_WITHDRAWAL,
      amount,
      status: TransactionStatus.PENDING, // Výběr na banku bude vyžadovat zpracování
      description: description || `Výběr ${amount} $ na bankovní účet`,
      externalReference: bankAccount,
    });

    const savedTransaction = await this.walletTxRepository.save(transaction);

    // Odečti ze zůstatku (dočasně, dokud se nevyřídí)
    await this.userRepository.decrement({ id: userId }, 'walletBalance', amount);

    // Audit log for bank withdrawal
    await this.auditLogService.logSuccess(
      AuditAction.WALLET_WITHDRAWAL,
      'wallet_transaction',
      savedTransaction.id,
      `Bank withdrawal of ${amount} $ requested`,
      {
        actorId: userId,
        newValues: {
          amount,
          type: TransactionType.BANK_WITHDRAWAL,
          status: TransactionStatus.PENDING,
          bankAccount: bankAccount ? `***${bankAccount.slice(-4)}` : undefined, // Mask bank account
        },
        entityOwnerId: userId,
      },
    );

    // Pošli notifikaci
    await this.notificationsClient.createInfoNotification(
      userId,
      'Žádost o výběr byla přijata 🏦',
      `Vaše žádost o výběr ${amount} $ byla přijata a bude zpracována do 3 pracovních dnů`,
      `/wallet`
    );

    // Načti transakci s relací user
    const transactionWithUser = await this.walletTxRepository.findOne({
      where: { id: savedTransaction.id },
      relations: ['user'],
    });

    return transactionWithUser!;
  }

  async refundContribution(contributionId: string, reason: string, actorId?: string): Promise<WalletTX> {
    const contribution = await this.contributionRepository.findOne({
      where: { id: contributionId },
      relations: ['contributor', 'campaign'],
    });

    if (!contribution) {
      throw new NotFoundException('Příspěvek nebyl nalezen');
    }

    if (contribution.isRefunded) {
      throw new BadRequestException('Příspěvek již byl vrácen');
    }

    // Vytvoř refund transakci
    const refundTransaction = this.walletTxRepository.create({
      userId: contribution.contributorId,
      type: TransactionType.REFUND,
      amount: contribution.amount,
      campaignId: contribution.campaignId,
      status: TransactionStatus.COMPLETED,
      description: `Vrácení příspěvku: ${reason}`,
    });

    const savedRefund = await this.walletTxRepository.save(refundTransaction);

    // Vrať peníze na účet
    await this.userRepository.increment({ id: contribution.contributorId }, 'walletBalance', contribution.amount);

    // Označ příspěvek jako vrácený
    await this.contributionRepository.update(contributionId, { isRefunded: true });

    // Audit log for refund
    await this.auditLogService.logSuccess(
      AuditAction.CONTRIBUTION_REFUND,
      'campaign_contribution',
      contributionId,
      `Refund of ${contribution.amount} $ for contribution to campaign "${contribution.campaign?.name || contribution.campaignId}"`,
      {
        actorId: actorId,
        oldValues: { isRefunded: false },
        newValues: { isRefunded: true, refundReason: reason },
        entityOwnerId: contribution.contributorId,
        metadata: { refundTransactionId: savedRefund.id },
      },
    );

    // Pošli notifikaci
    await this.notificationsClient.createInfoNotification(
      contribution.contributorId,
      'Příspěvek byl vrácen 💸',
      `Váš příspěvek ${contribution.amount} $ byl vrácen zpět na váš účet. Důvod: ${reason}`,
      `/wallet`
    );

    // Načti transakci s relací user
    const refundWithUser = await this.walletTxRepository.findOne({
      where: { id: savedRefund.id },
      relations: ['user'],
    });

    return refundWithUser!;
  }

  async refundAllContributions(campaignId: string, reason: string): Promise<WalletTX[]> {
    const contributions = await this.contributionRepository.find({
      where: {
        campaignId,
        isRefunded: false
      },
      relations: ['contributor'],
    });

    const refunds: WalletTX[] = [];

    for (const contribution of contributions) {
      const refund = await this.refundContribution(contribution.id, reason);
      refunds.push(refund);
    }

    return refunds;
  }

  async completeTransaction(transactionId: string): Promise<WalletTX> {
    await this.walletTxRepository.update(transactionId, {
      status: TransactionStatus.COMPLETED
    });

    const result = await this.walletTxRepository.findOne({
      where: { id: transactionId },
      relations: ['user']
    });
    if (!result) {
      throw new NotFoundException('Transakce nebyla nalezena');
    }
    return result;
  }

  async failTransaction(transactionId: string, reason: string): Promise<WalletTX> {
    const transaction = await this.walletTxRepository.findOne({
      where: { id: transactionId },
      relations: ['user'],
    });

    if (!transaction) {
      throw new NotFoundException('Transakce nebyla nalezena');
    }

    // Pokud je to výběr na banku, vrať peníze zpět
    if (transaction.type === TransactionType.BANK_WITHDRAWAL && transaction.status === TransactionStatus.PENDING) {
      await this.userRepository.increment({ id: transaction.userId }, 'walletBalance', transaction.amount);
    }

    await this.walletTxRepository.update(transactionId, {
      status: TransactionStatus.FAILED,
      description: `${transaction.description} - Neúspěšné: ${reason}`
    });

    // Pošli notifikaci o neúspěšné transakci
    await this.notificationsClient.createErrorNotification(
      transaction.userId,
      'Transakce selhala',
      `Vaše transakce selhala: ${reason}`,
      `/wallet`
    );

    const updatedTransaction = await this.walletTxRepository.findOne({
      where: { id: transactionId },
      relations: ['user']
    });
    if (!updatedTransaction) {
      throw new NotFoundException('Transakce nebyla nalezena po aktualizaci');
    }
    return updatedTransaction;
  }
}
